var gulp = require('gulp');
var plumber = require('gulp-plumber');
var ts = require('gulp-typescript');
var rename = require('gulp-rename');
var umd = require('gulp-umd');
var terser = require('gulp-terser');
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

gulp.task('clear', cb => {
	process.stdout.write('\x1b[2J'); // [1]
	cb();
});

let project = ts.createProject('src/tsconfig.json');

gulp.task('build', () =>
	project.src()
		.pipe(plumber())
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
		.pipe(plumber())
		.pipe(testProject())
		.pipe(gulp.dest('test/'))
);

gulp.task('watch', () => {
	gulp.watch('src/**/*', gulp.series('clear', 'build')); // [1]
});

gulp.task('watchTest', () => {
	gulp.watch('test/*.ts', gulp.series('clear', 'buildTest')); // [1]
});

gulp.task('default', gulp.series('build'));

/**
 * [1] 重新建製的時候先清空輸出以清除掉上次建製時可能有輸出的錯誤，以免 VS Code 的主控台關不掉
 */