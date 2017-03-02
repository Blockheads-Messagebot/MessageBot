/*jshint
    node: true
*/

const fs = require('fs');
const gulp = require('gulp');
const sass = require('gulp-sass');
const del = require('del');
const browserify = require('browserify');
const tsify = require('tsify');
const typedoc = require('gulp-typedoc');

gulp.task('_sass', function() {
    return gulp.src(['./src/**/*.scss', './src/**/*.sass'], {base: './src/'})
        .pipe(sass({outputStyle: 'compressed', includePaths: ['./src/ui/layout', './node_modules']}).on('error', sass.logError))
        .pipe(gulp.dest('./src'));
});

gulp.task('build', ['_sass'], function() {
    return browserify('./src/start.ts', {
            debug: true,
            paths: ['./src'],
        })
        .plugin(tsify, { noImplicitAny: true })
        .transform('brfs')
        .transform('babelify', {presets: ['es2015']})
        .bundle()
        .pipe(fs.createWriteStream('dist/bot.js'));
});

gulp.task('clean', function() {
    return del(['src/**/*.css', 'src/**/*.js']);
});

gulp.task('typedoc', function() {
    return gulp
        .src(['./src/libraries/*.ts'])
        .pipe(typedoc({
            module: 'commonjs',
            target: 'es5',

            out: './docs',

            name: 'MessageBot',
            ignoreCompilerErrors: false,
            excludeExternals: true,
            version: true,
            readme: './readme.md',
            verbose: true,
        }));
});

gulp.task('watch', ['build'], function() {
    gulp.watch(['./src/**', '!./src/**/*.css'], ['build']);
});

gulp.task('default', ['watch']);
