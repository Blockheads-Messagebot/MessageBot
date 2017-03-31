const fs = require('fs');
const gulp = require('gulp');
const del = require('del');
const browserify = require('browserify');
const tsify = require('tsify');

gulp.task('build', ['clean'], function() {
    return browserify('src/index.ts', {
            debug: false
        })
        .plugin(tsify)
        .transform('brfs')
        .transform('babelify', {presets: ['es2015']})
        .bundle()
        .pipe(fs.createWriteStream('build/bot.js'));
});

gulp.task('clean', function() {
    return del(['build/*', 'test-localStorage']);
});

gulp.task('watch', ['build'], function() {
    gulp.watch(['src/**/*'], ['build']);
});

gulp.task('default', ['watch']);
