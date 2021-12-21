let esb = require('gulp-esbuild');
let gulp = require('gulp');
let ts = require('gulp-typescript');
let rename = require('gulp-rename');
let wrapJS = require("@makeomatic/gulp-wrap-js");
let terser = require('gulp-terser');
let replace = require('gulp-replace');
let ifAnyNewer = require('gulp-if-any-newer');
let sourcemaps = require('gulp-sourcemaps');

let pkg = require('./package.json');
let header = `/**
 * ${pkg.name} v${pkg.version}
 * (c) 2019-${new Date().getFullYear()} Mu-Tsun Tsai
 * Released under the MIT License.
 */`;

let terserOption = {
	"mangle": {
		"properties": {
			"regex": /^[$_]/,
			"reserved": "__ob__"
		}
	},
	"output": {
		"comments": /^\*/,
	}
};

let projectDest = 'dist';

gulp.task('buildMin', () =>
	gulp.src(projectDest + '/shrewd.js')
		.pipe(sourcemaps.init({ loadMaps: true }))
		.pipe(terser(terserOption))
		.pipe(rename({ suffix: '.min' }))
		.pipe(sourcemaps.write('.', { includeContent: false }))
		.pipe(gulp.dest(projectDest))
);

gulp.task('updateVer', () =>
	gulp.src(['dist/shrewd.d.ts', 'dist/shrewd.js', 'dist/shrewd.min.js'])
		.pipe(replace(/\/\*\*\s[\s\S]+?\s\*\//, header))
		.pipe(gulp.dest('dist/'))
);

gulp.task('updateExample', () => (
	gulp.src('dist/shrewd.js*').pipe(gulp.dest('example/dist/')),
	gulp.src('dist/shrewd.d.ts').pipe(gulp.dest('example/src/'))
));

let exampleProject = ts.createProject('example/src/tsconfig.json');

gulp.task('buildExample', () =>
	exampleProject.src()
		.pipe(ifAnyNewer("example/dist"))
		.pipe(exampleProject())
		.pipe(gulp.dest('example/dist'))
);

gulp.task('esbuild', () =>
	gulp.src('src/Shrewd.ts')
		.pipe(esb({
			outfile: 'shrewd.js',
			bundle: true,
			sourcemap: 'external',
			globalName: 'Shrewd'
		}))
		.pipe(gulp.dest(projectDest))
);

gulp.task('eswrap', () =>
	gulp.src(projectDest + '/shrewd.js')
		.pipe(sourcemaps.init({ loadMaps: true }))
		.pipe(wrapJS(`${header};(function(root,factory){if(typeof define==='function'&&define.amd)
			{define([],factory);}else if(typeof exports==='object'){module.exports=factory();}
			else{root.Shrewd=factory();}}(this,function(){ %= body % ;return Shrewd;}));`
		))
		.pipe(sourcemaps.write('.', { includeContent: false, sourceRoot: '../' }))
		.pipe(gulp.dest(projectDest))
)

gulp.task('buildMain', gulp.series('esbuild', 'eswrap'));

gulp.task('build', gulp.series('buildMain', 'buildMin'));

gulp.task('default', gulp.series('build', 'updateVer', 'updateExample', 'buildExample'));
