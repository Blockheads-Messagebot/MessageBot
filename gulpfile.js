const fs = require('fs');
const gulp = require('gulp');
const del = require('del');
const browserify = require('browserify');
const {spawn} = require('child_process');
const path = require('path');

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

gulp.task('browserify', ['build'], function() {
    return browserify('build/index.js', {
            debug: false
        })
        .transform('brfs')
        .transform('babelify', {presets: ['es2015']})
        .bundle()
        .pipe(fs.createWriteStream('build/compiled/bot.js'));
});

gulp.task('docs', function() {
    return run('typedoc', [
        '--options',
        './typedoc.json'
    ]);
});

gulp.task('test', function() {
    return run('mocha', [
        '-r', 'ts-node/register',
        'src/**/*.test.ts'
    ]);
});

gulp.task('clean', function() {
    return del(['build/**/*', '!build/compiled', 'test-localStorage']);
});

gulp.task('watch', ['browserify'], function() {
    gulp.watch(['src/**/*'], ['browserify']);
});

gulp.task('all', ['browserify', 'docs', 'test']);
gulp.task('default', ['browserify']);
