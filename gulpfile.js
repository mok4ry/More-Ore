// dev dependencies
var babelify = require('babelify');
var browserify = require('browserify');
var del = require('del');
var gulp = require('gulp');
var rename = require('gulp-rename');
var replace = require('gulp-replace');
var source = require('vinyl-source-stream');

// build configuration
var config = {
    // input files
    src: './',
    index: 'dev.html',
    main: 'main.js',

    // output files
    dist: './',
    jsOut: 'more-ore.js',
    indexOut: 'index.html'
};

var bundler;
function getBundler() {
    return bundler ? bundler : (bundler = browserify(config.main, { debug: true }));
}

function bundle() {
    return getBundler()
        .transform(babelify)
        .bundle()
        .pipe(source(config.jsOut))
        .pipe(gulp.dest(config.dist));
}

gulp.task('clean', function () {
    return del([
        config.dist + config.jsOut,
        config.dist + config.indexOut
    ]);
});

gulp.task('html', ['clean'], function () {
    return gulp.src(config.src + config.index)
        .pipe(rename(config.indexOut))
        .pipe(replace(config.main, config.jsOut))
        .pipe(gulp.dest(config.dist));
});

gulp.task('bundle', ['clean'], function () {
    return bundle();
});

gulp.task('build', ['clean', 'bundle', 'html']);

gulp.task('default', ['build']);
