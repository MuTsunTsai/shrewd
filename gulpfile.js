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

gulp.task('build', () =>
	gulp.src('src/**/*.ts')
		.pipe(plumber())
		.pipe(ts.createProject('src/tsconfig.json')())
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

gulp.task('buildTest', () =>
	gulp.src('test/*.ts')
		.pipe(plumber())
		.pipe(ts.createProject('test/tsconfig.json')())
		.pipe(gulp.dest('test/'))
);

gulp.task('watch', () => {
	gulp.watch('src/**/*', gulp.series('clear', 'build')); // [1]
});

gulp.task('watchTest', () => {
	gulp.watch('test/*.ts', gulp.series('clear', 'buildTest')); // [1]
});

gulp.task('default', gulp.parallel(
	gulp.series('build', 'watch'),
	gulp.series('buildTest', 'watchTest')
));

/**
 * [1] 重新建製的時候先清空輸出以清除掉上次建製時可能有輸出的錯誤，以免 VS Code 的主控台關不掉
 */