const fs = require('fs');
const gulp = require('gulp');
const del = require('del');
const browserify = require('browserify');
const {spawn} = require('child_process');
const path = require('path');
const tsify = require('tsify');
const sass = require('gulp-sass');

function run(command, args, alwaysLog = false) {
    if (process.platform == 'win32') {
        command += '.cmd';
    }

    let cmd = spawn(
        path.join(__dirname, '/node_modules/.bin/', command),
        args
    );

    let output = '';
    cmd.stdout.setEncoding('utf8');
    cmd.stderr.setEncoding('utf8');
    cmd.stdout.on('data', data => output += data);
    cmd.stderr.on('data', data => output += data);

    return new Promise((resolve, reject) => {
        cmd.on('exit', code => {
            if (code || alwaysLog) {
                console.log(output);
            }
            resolve();
        });
        cmd.on('error', reject);
    })
}

// Note: It is assumed that gulp will be started with `npm start gulp -- task`.

gulp.task('lint', function() {
    return run('tslint', [
        '-c', 'tslint.json',
        './src/**/*.ts'
    ]);
});

gulp.task('build', ['lint'], function()  {
    return run('tsc');
});

gulp.task('scss', function() {
    return gulp.src('./src/**/*.scss')
        .pipe(sass({ outputStyle: 'compressed' }).on('error', sass.logError))
        .pipe(gulp.dest('./src'));
});

gulp.task('browserify', ['scss'], function() {
    return browserify(['src/index.ts'], {
            debug: false
        })
        .plugin(tsify)
        .transform('brfs')
        .bundle()
        .pipe(fs.createWriteStream('build/compiled/bot.js'));
});

gulp.task('docs', function() {
    return run('typedoc', [
        '--options', './typedoc.json',
        '--target', 'es6' //NOTE: This is a hack to let typedoc work until it updates to Typescript 2.3.
    ]);
});

gulp.task('build:test', function() {
    let testFiles = require('glob').sync('src/**/*.test.ts');
    return browserify({
            debug: false,
            entries: testFiles,
        })
        .plugin(tsify)
        .transform('brfs')
        .bundle()
        .pipe(fs.createWriteStream('test/tests.js'));
});

gulp.task('clean', function() {
    return del(['build/**/*', '!build/compiled', 'src/**/*.css']);
});

gulp.task('watch', ['browserify'], function() {
    gulp.watch(['src/**/*'], ['browserify']);
});

gulp.task('all', ['browserify', 'build', 'docs']);
gulp.task('default', ['browserify']);
