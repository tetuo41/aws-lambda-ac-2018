'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const buildTag = require('uuid/v1')();

const gulp = require('gulp');
const plugins = require('gulp-load-plugins')();
const clean = plugins.clean;
const install = plugins.install;
const zip = plugins.zip;

const dist = process.env['CIRCLE_ARTIFACTS'] || 'dist';
const tmp = os.tmpdir();
const tmpdir = path.join(tmp, 'aws-lamda-' + buildTag);

// copy
gulp.task('copy', () => {
  let src = [
    path.join('src', '**', '*'),
    path.join('!src', '**', 'node_modules', '**/**/*')
  ];
  return gulp.src(src)
    .pipe(gulp.dest(tmpdir));
});

// install
gulp.task('install', () => {
  let src = path.join(tmpdir, '**', '*');
  return gulp.src(src)
    .pipe(install());
});

// clobber
gulp.task('clobber', () => {
  let src = path.join(dist, '*');
  return gulp.src(src, { read: false })
    .pipe(clean());
});

// dist
const distSeries = ['copy', 'install'];
fs.readdirSync('src').forEach((dir) => {
  let src = path.join(tmpdir, dir, '**', '*');
  distSeries.push(() => {
    return gulp.src(src)
      .pipe(zip(dir + '-' + buildTag + '.zip'))
      .pipe(gulp.dest(dist));
  });
});
distSeries.push((done) => {
  done();
  console.log('Build tag: ' + buildTag);
});
gulp.task('dist', gulp.series.apply(gulp.series, distSeries));
