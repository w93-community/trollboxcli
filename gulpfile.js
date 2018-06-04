var gulp = require('gulp')
var source = require('vinyl-source-stream')
var buffer = require('vinyl-buffer')
var browserify = require('browserify')
var buble = require('gulp-buble')

gulp.task('build', function() {
  return browserify('./src/main.js')
    .bundle()
    .pipe(source('bundle.js'))
    .pipe(buffer())
    .pipe(buble())
    .pipe(gulp.dest('./build/'))
})
