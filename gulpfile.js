/*jshint
    node: true
*/

var gulp = require('gulp');
var rename = require('gulp-rename');
var babel = require('gulp-babel');
var comments = require('gulp-strip-comments');
var include_file = require("gulp-include-file");
var sass = require('gulp-sass');
var del = require('del');

var browserify = require('browserify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');

gulp.task('_sass', function() {
    return gulp.src(['./dev/**/*.scss', './dev/**/*.sass'], {base: './dev/'})
        .pipe(sass({outputStyle: 'compressed', includePaths: ['./dev/ui/layout']}).on('error', sass.logError))
        .pipe(gulp.dest('./dev'));
});

gulp.task('bundle', ['_sass'], function() {
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

gulp.task('clean', ['bundle'], function() {
    return del(['dev/**/*.css']);
});

gulp.task('all', ['clean'], function() {
    console.log('Build finished at ' + Date());
});

gulp.task('watch', ['all'], function() {
    gulp.watch(['./dev/**', '!./dev/**/*.css'], ['all']);
});

gulp.task('default', ['watch']);
