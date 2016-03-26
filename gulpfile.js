var gulp = require('gulp');
var concat = require('gulp-concat');
var jshint = require('gulp-jshint');
var rename = require('gulp-rename');
var babel = require('gulp-babel');
var comments = require('gulp-strip-comments');
var injectFile = require('gulp-inject-file');
var htmlmin = require('gulp-htmlmin');
var del = require('del');

gulp.task('lint', function() {
	return gulp.src('dev/*.js')
		.pipe(jshint())
		.pipe(jshint.reporter('default'));
});

gulp.task('_minhtml', function() {
	return gulp.src('dev/bot.html')
		.pipe(htmlmin({
			collapseWhitespace: true, 
			conservativeCollapse: true, 
			quoteCharacter: '"', 
			minifyCSS: true
		}))
		.pipe(rename('tmpbot.html'))
		.pipe(gulp.dest('dev'));
});

gulp.task('_mincss', function() {
	return gulp.src('dev/bot.css')
		.pipe(htmlmin({
			collapseWhitespace: true,
			conservativeCollapse: true,
			quoteCharacter: '"',
			minifyCSS: true
		}))
		.pipe(rename('tmpbot.css'))
		.pipe(gulp.dest('dev'));
})

gulp.task('inject', ['_minhtml', '_mincss'], function() {
	return gulp.src('dev/MessageBot.js')
		.pipe(injectFile({
			pattern: '{{inject <filename>}}'
		}))
		.pipe(rename('tmpMessageBot.js'))
		.pipe(gulp.dest('dev'));
});

gulp.task('scripts', ['inject'], function() {
	return gulp.src(['dev/header.js', 'dev/MessageBotCore.js', 'dev/tmpMessageBot.js', 'dev/MessageBotExtension.js', 'dev/footer.js'])
		.pipe(concat('bot.js'))
		.pipe(comments())
		.pipe(babel({
			presets: ['es2015']
		}))
		.pipe(gulp.dest('dist'));
});

gulp.task('clean', ['scripts'], function() {
	return del(['dev/tmp*']);
});

gulp.task('watch', function() {
	gulp.watch('dev/*', ['all']);
});

gulp.task('all', ['lint', 'scripts', 'clean']);

gulp.task('default', ['all', 'watch'], function() {
	console.log('Done!');
});
