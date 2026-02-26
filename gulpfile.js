const gulp = require('gulp');
const webBuildTasks = require('web-build-tasks');

const rootGlobs = ['./app/src/index.js', './app/src/ai-worker.js'];

const cdnEntries = [
  {
    file: '/node_modules/bootstrap/dist/css/bootstrap.min.css',
    package: 'bootstrap',
    cdn: 'https://maxcdn.bootstrapcdn.com/bootstrap/${ version }/css/bootstrap.min.css',
  },
  {
    file: '/node_modules/bootstrap/dist/js/bootstrap.min.js',
    package: 'bootstrap',
    cdn: 'https://maxcdn.bootstrapcdn.com/bootstrap/${ version }/js/bootstrap.min.js',
  },
  {
    file: '/node_modules/spin.js/spin.min.js',
    package: 'spin.js',
    cdn: 'https://cdnjs.cloudflare.com/ajax/libs/spin.js/${ version }/spin.min.js',
  },
];

webBuildTasks.define(gulp, { rootGlobs, cdnEntries });
