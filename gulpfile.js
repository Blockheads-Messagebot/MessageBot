const fs = require('fs');
const gulp = require('gulp');
const del = require('del');
const browserify = require('browserify');

gulp.task('build', function() {
    return browserify('build/index.js', {
            debug: false
        })
        .transform('brfs')
        .transform('babelify', {presets: ['es2015']})
        .bundle()
        .pipe(fs.createWriteStream('build/compiled/bot.js'));
});

gulp.task('clean', function() {
    return del(['build/**/*', '!build/compiled', 'test-localStorage']);
});

gulp.task('watch', ['build'], function() {
    gulp.watch(['src/**/*'], ['build']);
});

gulp.task('default', ['watch']);
