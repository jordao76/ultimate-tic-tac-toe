# coffeelint: disable=max_line_length

gulp = require 'gulp'
$ = (require 'gulp-load-plugins')()
run = require 'run-sequence'

onError = (error) ->
  $.util.log error
  process.exit 1 # note: shouldn't exit on a live-reload/watch environment

# build

gulp.task 'lint', ->
  gulp.src ['./gulpfile.coffee', './app/**/*.coffee']
    .pipe $.coffeelint()
    .pipe $.coffeelint.reporter()
    .pipe $.coffeelint.reporter 'failOnWarning'

gulp.task 'scripts', ['lint'], ->
  browserify = require 'browserify'
  source = require 'vinyl-source-stream'
  buffer = require 'vinyl-buffer'
  coffeeify = require 'coffeeify'

  browserify entries: ['./app/scripts/index.coffee'], extensions: ['.coffee'], debug: true
    .transform(coffeeify)
    .bundle()
    .pipe source 'main.min.js'
    .pipe buffer()
    .pipe $.sourcemaps.init loadMaps: true
    .pipe $.uglify()
    .pipe $.sourcemaps.write './'
    .pipe gulp.dest 'dist/scripts'

gulp.task 'jade', ->
  gulp.src 'app/*.jade'
    .pipe $.jade pretty: yes
    .pipe gulp.dest '.tmp'

gulp.task 'html', ['jade'], ->
  assets = $.useref.assets searchPath: 'app'
  gulp.src '.tmp/*.html'
    .pipe assets
    .pipe $.if '*.css', $.csso()
    .pipe assets.restore()
    .pipe $.useref()
    .pipe $.if '*.html', $.minifyHtml conditionals: true
    .pipe gulp.dest 'dist'

gulp.task 'clean',
  require 'del'
    .bind null, 'dist'

gulp.task 'build', (done) ->
  run 'clean', ['scripts', 'html'], done

gulp.task 'default', ['build']

# serve

gulp.task 'connect', ['build'], ->
  connect = require 'connect'
  serveStatic = require 'serve-static'
  app = connect()
    .use (require 'connect-livereload') port: 35729
    .use serveStatic 'dist'
    .use '/bower_components', serveStatic './bower_components'

  require 'http'
    .createServer app
    .listen 9000
    .on 'listening', -> $.util.log 'Started connect web server on http://localhost:9000'

gulp.task 'watch', ['connect'], ->
  gulp.watch ['app/**/*.coffee'], ['scripts']
  gulp.watch ['app/*.jade', 'app/styles/**/*.css'], ['html']

  $.livereload.listen()
  gulp.watch ['dist/*.html', 'dist/styles/**/*.css', 'dist/scripts/**/*.js']
    .on 'change', $.livereload.changed

gulp.task 'serve', ['watch'], ->
  (require 'opn') 'http://localhost:9000'