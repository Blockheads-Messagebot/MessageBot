const args = process.argv.slice(2);

// If the task includes watch, include the --watch flag as well.
if (args[0].includes('watch')) {
    args.push('--watch');
}

const gulp = require('gulp');

const browserify = require('browserify');
const watchify = require('watchify');
const fs = require('fs');

// For compiling scss
const scss = require('scssify');

// For browserify bundling
const tsify = require('tsify');
// Just for compiling
const ts = require('gulp-typescript');
const tsProject = ts.createProject('tsconfig.json', {declaration: true });

gulp.task('build:browser', function() {
    let b = browserify(['src/index.ts'], { debug: true /* sourcemaps */ })
        .plugin(tsify)
        .plugin('minifyify', {map: 'bot.js.map', output: __dirname + '/build/compiled/bot.js.map'})
        .transform(scss, { autoInject: false, export: true })
        .transform('brfs')

    let bundle = () => b.bundle().pipe(fs.createWriteStream('build/compiled/bot.js'))

    if (args.includes('--watch')) {
        let w = watchify(b);
        w.on('update', () => bundle());
        w.on('log', console.log);
    }

    return bundle();
});

gulp.task('build:node', function() {
    return gulp.src('src/**/*.ts')
        .pipe(tsProject())
        .js.pipe(gulp.dest('build'));
});

gulp.task('build:test', function() {
    let testFiles = require('glob').sync('src/**/*.test.ts');

    return browserify({
            debug: false,
            entries: testFiles,
        })
        .plugin(tsify)
        .transform(scss, { autoInject: false, export: true })
        .transform('brfs')
        .bundle()
        .pipe(fs.createWriteStream('test/tests.js'));
});

gulp.task('build', ['build:browser', 'build:node']);

gulp.task('build:watch', ['build'], function() {
    gulp.watch('src/**/*.ts', ['build:node']);
});
