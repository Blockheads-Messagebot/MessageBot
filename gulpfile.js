const fs = require('fs');
const gulp = require('gulp');
const sass = require('gulp-sass');
const del = require('del');
const browserify = require('browserify');
const ts = require('gulp-typescript');

gulp.task('_sass', function() {
    return gulp.src(['src/**/*.scss', 'src/**/*.sass'], {base: './src/'})
        .pipe(sass({outputStyle: 'compressed', includePaths: ['./src/ui/layout', './node_modules']})
            .on('error', sass.logError))
        .pipe(gulp.dest('build'));
});

gulp.task('typescript', ['clean'], function() {
    return gulp.src(['src/index.ts', 'src/**/*.ts'])
        .pipe(ts.createProject('./tsconfig.json')())
        .pipe(gulp.dest('build'));
});

gulp.task('build', ['_sass', 'typescript'], function() {
    return browserify('build/index.js', {
            debug: false
        })
        .transform('brfs')
        .transform('babelify', {presets: ['es2015']})
        .bundle()
        .pipe(fs.createWriteStream('build/compiled/bot.js'));
});

gulp.task('clean', function() {
    return del(['build/*', '!build/compiled', 'build/compiled/*', 'docs', 'test-localStorage', 'localStorage']);
});

gulp.task('watch', ['build'], function() {
    gulp.watch(['src/**/*'], ['build']);
});

gulp.task('default', ['watch']);
