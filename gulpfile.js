var gulp = require('gulp')
var source = require('vinyl-source-stream')
var buffer = require('vinyl-buffer')
var browserify = require('browserify')
var sourcemaps = require('gulp-sourcemaps')
var log = require('gulplog')
var buble = require('gulp-buble')
var env = require('gulp-env')

gulp.task('build', function() {
  return browserify({
    entries: './src/main.js',
    debug: true
  })
    .bundle()
    .pipe(source('bundle.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({ loadMaps: true }))
      .pipe(buble())
      .on('error', log.error)
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./build/'))
    .pipe(gulp.dest('./build/'))
})
