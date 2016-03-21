var gulp = require('gulp');
var concat = require('gulp-concat');
var jshint = require('gulp-jshint');
var babel = require('gulp-babel');
var comments = require('gulp-strip-comments');

gulp.task('lint', function() {
	return gulp.src('dev/*.js')
		.pipe(jshint())
		.pipe(jshint.reporter('default'));
});

gulp.task('scripts', function() {
	return gulp.src(['dev/header.js', 'dev/MessageBotCore.js', 'dev/MessageBot.js', 'dev/MessageBotExtension.js', 'dev/footer.js'])
		.pipe(concat('bot.js'))
		.pipe(comments())
		.pipe(babel({
			presets: ['es2015-loose']
		}))
		.pipe(gulp.dest('dist'));
});

gulp.task('watch', function() {
	gulp.watch('dev/*js', ['lint', 'scripts']);
})

gulp.task('default', ['lint', 'scripts', 'watch']);