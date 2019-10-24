var gulp = require('gulp');
var ts = require('gulp-typescript');
var rename = require('gulp-rename');
var wrapJS = require("gulp-wrap-js");
var terser = require('gulp-terser');
var replace = require('gulp-replace');
var ifAnyNewer = require('gulp-if-any-newer');
var sourcemaps = require('gulp-sourcemaps');

var pkg = require('./package.json');
var header = `/**
 * ${pkg.name} v${pkg.version}
 * (c) ${new Date().getFullYear()} Mu-Tsun Tsai
 * Released under the MIT License.
 */`;

var terserOption = {
	"mangle": {
		"properties": {
			"regex": /^[$_]/
		}
	},
	"output": {
		"comments": true
	}
};

let project = ts.createProject('src/tsconfig.json');

gulp.task('buildMain', () =>
	project.src()
		.pipe(ifAnyNewer("dist", { filter: 'shrewd.js' }))
		.pipe(sourcemaps.init())
		.pipe(project())
		.pipe(wrapJS(`${header};(function(root,factory){if(typeof define==='function'&&define.amd)
			{define([],factory);}else if(typeof exports==='object'){module.exports=factory();}
			else{root.Shrewd=factory();}}(this,function(){ %= body % ;return Shrewd;}));`
		))
		.pipe(sourcemaps.write('.', { includeContent: false, sourceRoot: '../src' }))
		.pipe(gulp.dest('dist/'))
);

gulp.task('buildMin', () =>
	gulp.src('dist/shrewd.js')
		.pipe(sourcemaps.init({ loadMaps: true }))
		.pipe(terser(terserOption))
		.pipe(rename({ suffix: '.min' }))
		.pipe(sourcemaps.write('.', { includeContent: false }))
		.pipe(gulp.dest('dist/'))
);

var testProject = ts.createProject('test/tsconfig.json');

gulp.task('buildTest', () =>
	testProject.src()
		.pipe(ifAnyNewer("test/tests"))
		.pipe(sourcemaps.init())
		.pipe(testProject())
		.pipe(sourcemaps.write({ includeContent: false, sourceRoot: '../src' }))
		.pipe(gulp.dest('test/tests'))
);

gulp.task('updateDTS', () =>
	gulp.src('dist/shrewd.d.ts')
		.pipe(replace(/\/\*\*\s[\s\S]+?\s\*\//, header))
		.pipe(gulp.dest('dist/'))
);

gulp.task('updateExample', () =>
	gulp.src('dist/shrewd.js').pipe(gulp.dest('example/dist/')),
	gulp.src('dist/shrewd.d.ts').pipe(gulp.dest('example/src/'))
);

gulp.task('preTest', gulp.series('buildMain', 'buildTest'));

gulp.task('build', gulp.series('buildMain', 'buildMin'));

gulp.task('default', gulp.series('build', 'buildTest', 'updateDTS', 'updateExample'));
