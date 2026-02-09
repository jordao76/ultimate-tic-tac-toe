# coffeelint: disable=max_line_length

gulp = require 'gulp'
webBuildTasks = require 'web-build-tasks'

rootGlobs = ['./app/src/index.coffee', './app/src/ai-worker.coffee']

cdnEntries = [
  {
    file: '/bower_components/jquery/dist/jquery.min.js'
    package: 'jquery'
    cdn: 'https://code.jquery.com/jquery-${ version }.min.js'
  }
  {
    file: '/bower_components/bootstrap/dist/css/bootstrap.min.css'
    package: 'bootstrap'
    cdn: 'https://maxcdn.bootstrapcdn.com/bootstrap/${ version }/css/bootstrap.min.css'
  }
  {
    file: '/bower_components/bootstrap/dist/js/bootstrap.min.js'
    package: 'bootstrap'
    cdn: 'https://maxcdn.bootstrapcdn.com/bootstrap/${ version }/js/bootstrap.min.js'
  }
  {
    file: '/bower_components/spin.js/spin.min.js'
    package: 'spin.js'
    cdn: 'https://cdnjs.cloudflare.com/ajax/libs/spin.js/${ version }/spin.min.js'
  }
]

webBuildTasks.define gulp, {rootGlobs, cdnEntries}
