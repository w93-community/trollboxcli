var gulp = require('gulp')
var source = require('vinyl-source-stream')
var browserify = require("browserify");

gulp.task('default', function() {
  return browserify("./src/main.js")
    .bundle()
    .pipe(source('bundle.js'))
    .pipe(gulp.dest('./build/'))
})
