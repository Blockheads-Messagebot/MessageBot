const fs = require('fs');
const gulp = require('gulp');
const del = require('del');
const browserify = require('browserify');
const ts = require('gulp-typescript');

gulp.task('typescript', ['clean'], function() {
    return gulp.src(['src/index.ts', 'src/**/*.ts'])
        .pipe(ts.createProject('./tsconfig.json')())
        .pipe(gulp.dest('build'));
});

gulp.task('build', ['typescript'], function() {
    return browserify('build/index.js', {
            debug: false
        })
        .transform('brfs')
        .transform('babelify', {presets: ['es2015']})
        .bundle()
        .pipe(fs.createWriteStream('build/compiled/bot.js'));
});

gulp.task('clean', function() {
    return del(['build/*', '!build/compiled', 'build/compiled/*', 'test-localStorage']);
});

gulp.task('watch', ['build'], function() {
    gulp.watch(['src/**/*'], ['build']);
});

gulp.task('default', ['watch']);
