var execFile    = require('child_process').execFile;
var flow        = require('flow-bin');
var gulp        = require('gulp');
var path        = require('path')
var util        = require('gulp-util');
var webpack     = require('webpack');
var gulpWebpack = require('gulp-webpack');
var _           = require('lodash');

gulp.task('build', ['flow:check'], function() {
  bundleForProduction();
});

gulp.task('dev', ['flow:start'], function() {
  bundleForDevelopment().pipe(calledWheneverJsIsRebundled);
  gulp.watch(['src/**/*.js', 'test/**/*.js'], ['flow:status']);
});

gulp.task('typecheck', function(callback) {
  runFlow(['start'], function() {
    runFlow(['status', '--no-auto-start'], callback);
  })
});

// Assumes Flow server is running in background
gulp.task('flow:status', function(callback) {
  runFlow(['status', '--no-auto-start'], callback);
});

// Synchronous check; no background server started
gulp.task('flow:check', function(callback) {
  runFlow(['check'], callback);
})

// Runs flow server in background
gulp.task('flow:start', function(callback) {
  runFlow(['start'], callback);
});

gulp.task('flow:stop', function(callback) {
  runFlow(['stop'], callback);
})

function runFlow(cmd, callback) {
  execFile(flow, cmd, {
    cwd: module.__dirname
  }, function(err, stdout, stderr) {
    if (err && stdout.length > 0) {
      callback(new util.PluginError('flow', stdout));
    }
    else if (err) {
      callback(err);
    }
    else {
      callback();
    }
  });
}

function bundle(opts) {
  return gulp.src('src/index.js')
    .pipe(gulpWebpack(_.merge({
      entry: {
        index: './src/index.js',
      },
      output: {
        filename: '[name].js',
      },
      module: {
        loaders: [
          { test: /\.js$/, exclude: /\/node_modules\//, loader: 'babel-loader' },
        ]
      },
    }, opts), webpack))
    .pipe(gulp.dest('static/js/'));
}

function bundleForDevelopment(opts) {
  return bundle({
    watch: true,
    devtool: 'source-map',
    debug: true,
    noInfo: true,
  });
}

function bundleForProduction() {
  return bundle({
    devtool: 'source-map',
    noInfo: true,
    plugins: [
      new webpack.DefinePlugin({
        'process.env': {
          // This has an effect on the react lib size
          'NODE_ENV': JSON.stringify('production')
        }
      }),
      new webpack.optimize.DedupePlugin(),
      new webpack.optimize.UglifyJsPlugin({ compress: { warnings: false } }),
    ],
  });
}
