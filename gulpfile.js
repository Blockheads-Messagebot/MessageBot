var gulp = require('gulp');
var concat = require('gulp-concat');
var jshint = require('gulp-jshint');
var rename = require('gulp-rename');
var babel = require('gulp-babel');
var comments = require('gulp-strip-comments');
var stripDebug = require('gulp-strip-debug');
var injectFile = require('gulp-inject-file');
var htmlmin = require('gulp-htmlmin');
var cleanCSS = require('gulp-clean-css');
var del = require('del');

gulp.task('_minbodyhtml', function() {
	return gulp.src('dev/body.html')
		.pipe(htmlmin({
			collapseWhitespace: true,
			conservativeCollapse: true,
			quoteCharacter: '"',
			minifyCSS: true
		}))
		.pipe(rename('tmpbody.html'))
		.pipe(gulp.dest('dist'));
});

gulp.task('_minheadhtml', function() {
	return gulp.src('dev/head.html')
		.pipe(htmlmin({
			collapseWhitespace: true,
			conservativeCollapse: true,
			quoteCharacter: '"',
			minifyCSS: true
		}))
		.pipe(rename('tmphead.html'))
		.pipe(gulp.dest('dist'));
});

gulp.task('_minhtml', ['_minheadhtml', '_minbodyhtml']);

gulp.task('_mincss', function() {
	return gulp.src('dev/bot.css')
		.pipe(cleanCSS({
			keepSpecialComments: 0
		}))
		.pipe(rename('tmpbot.css'))
		.pipe(gulp.dest('dist'));
});

gulp.task('inject', ['_minhtml', '_mincss'], function() {
	return gulp.src('dev/MessageBotUI.js')
		.pipe(injectFile({
			pattern: '{{inject <filename>}}'
		}))
		.pipe(rename('tmpMessageBotUI.js'))
		.pipe(gulp.dest('dist'));
});

gulp.task('scripts', ['inject'], function() {
	return gulp.src(['dev/header.js', 'dev/MessageBotCore.js', 'dist/tmpMessageBotUI.js', 'dev/MessageBot.js', 'dev/MessageBotExtension.js', 'dev/footer.js'])
		.pipe(concat('dev.js'))
		.pipe(babel({
			presets: ['es2015']
		}))
		.pipe(gulp.dest('dist'))
		.pipe(stripDebug())
		.pipe(comments())
		.pipe(rename('bot.js'))
		.pipe(gulp.dest('dist'));
});

gulp.task('clean', ['scripts'], function() {
	return del(['dist/tmp*']);
});

gulp.task('watch', ['all'], function() {
	gulp.watch('dev/*', ['all']);
});

gulp.task('all', ['scripts', 'clean'], function() {
	console.log('Build finished at ' + Date());
});

gulp.task('default', ['watch']);
