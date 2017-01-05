/*jshint
    node: true
*/

var gulp = require('gulp');
var rename = require('gulp-rename');
var babel = require('gulp-babel');
var comments = require('gulp-strip-comments');
var include_file = require("gulp-include-file");
var htmlmin = require('gulp-htmlmin');
var replace = require('gulp-replace');
var sass = require('gulp-sass');
var del = require('del');

var browserify = require('browserify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');

gulp.task('_minbodyhtml', function() {
    return gulp.src('dev/page/body.html')
        .pipe(htmlmin({
            collapseWhitespace: true,
            conservativeCollapse: true,
            quoteCharacter: '"',
        }))
        .pipe(rename('tmpbody.html'))
        .pipe(gulp.dest('dist'));
});

gulp.task('_minheadhtml', function() {
    return gulp.src('dev/page/head.html')
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

gulp.task('_sass', function() {
    return gulp.src('dev/page/main.scss')
        .pipe(sass({outputStyle: 'compressed', includePaths: ['dev/page/partials']}).on('error', sass.logError))
        .pipe(replace(/\n/g, ''))
        .pipe(rename('tmpbot.css'))
        .pipe(gulp.dest('dist'));
});

////// folders: view framework ui
gulp.task('test', function() {
    return gulp.src(['./dev/*.scss', './dev/*.sass'], {base: './dev/'})
        .pipe(sass({outputStyle: 'compressed', includePaths: ['./dev/layout']}).on('error', sass.logError))
        .pipe(gulp.dest('./dev'));
});

gulp.task('inject', ['_minhtml', '_sass'], function() {
    var b = browserify({
      entries: './dev/start.js',
      debug: true
    });

    return b.bundle()
        .pipe(source('app.js')) //Can app.js be removed?
        .pipe(buffer())
        .pipe(include_file())
        .pipe(rename('dev.js'))
        .pipe(gulp.dest('dist'))
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(comments())
        .pipe(rename('bot.js'))
        .pipe(gulp.dest('dist'));
});

gulp.task('clean', ['inject'], function() {
    return del(['dist/tmp*']);
});

gulp.task('all', ['clean'], function() {
    console.log('Build finished at ' + Date());
});

gulp.task('watch', ['all'], function() {
    gulp.watch(['dev/**'], ['all']);
});

gulp.task('default', ['watch']);
