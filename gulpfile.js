var gulp = require('gulp');
var ts = require('gulp-typescript');
var rename = require('gulp-rename');
var umd = require('gulp-umd');
var terser = require('gulp-terser');
var ifAnyNewer = require('gulp-if-any-newer');
var sourcemaps = require('gulp-sourcemaps');
var headerComment = require('gulp-header-comment');

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

gulp.task('build', () =>
	project.src()
		.pipe(project())
		.pipe(umd({ exports: () => "Shrewd" }))
		.pipe(headerComment(`
			<%= pkg.name %> v<%= pkg.version %>
			(c) <%= moment().format('YYYY') %> Mu-Tsun Tsai
			Released under the MIT License.
		`))
		.pipe(gulp.dest('dist/'))
		.pipe(terser(terserOption))
		.pipe(rename({ suffix: '.min' }))
		.pipe(gulp.dest('dist/'))
);

var testProject = ts.createProject('test/tsconfig.json');

gulp.task('buildTest', () =>
	testProject.src()
		.pipe(ifAnyNewer("test/tests"))
		.pipe(sourcemaps.init())
		.pipe(testProject())
		.pipe(sourcemaps.write({includeContent: false, sourceRoot: '../src'}))
		.pipe(gulp.dest('test/tests'))
);

gulp.task('default', gulp.series('build', 'buildTest'));
