/*jshint
    node: true
*/

const fs = require('fs');
const gulp = require('gulp');
const sass = require('gulp-sass');
const del = require('del');
const browserify = require('browserify');

gulp.task('_sass', function() {
    return gulp.src(['./dev/**/*.scss', './dev/**/*.sass'], {base: './dev/'})
        .pipe(sass({outputStyle: 'compressed', includePaths: ['./dev/ui/layout', './node_modules']}).on('error', sass.logError))
        .pipe(gulp.dest('./dev'));
});

gulp.task('bundle', ['_sass'], function() {
    return browserify('./dev/start.js', {
            debug: true,
            paths: ['./dev'],
        })
        .transform('brfs')
        .transform('babelify', {presets: ['es2015']})
        .bundle()
        .pipe(fs.createWriteStream('dist/bot.js'));
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
