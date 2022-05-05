const path = require('path');
const fs = require('fs');
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlPlugin = require('html-webpack-plugin');

const pkg = require('../../../package.json');

const INVALID_FILES = ['.DS_Store'];
const STATIC_DIR = path.join(__dirname, '../src/static');

module.exports = {
  entry: path.join(__dirname, '../src/index.tsx'),
  module: {
    rules: [
      {
        test: /\.(j|t)sx?$/,
        use: ['babel-loader'],
        exclude: [/node_modules/],
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(jpe?g|png|svg|gif)$/,
        type: 'asset/resource',
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, '../src'),
      '#': path.resolve(__dirname, '../../../shared'),
    },
    symlinks: false,
  },
  plugins: [
    new webpack.DefinePlugin({
      __ENV__: JSON.stringify({
        VERSION: pkg.version,
        BUILD_TIME: new Date(),
        EMPTY_IMAGE_LIST: fs
          .readdirSync(`${STATIC_DIR}/empty_image`)
          .filter((f) => !INVALID_FILES.includes(f))
          .map((f) => `/empty_image/${f}`),
        ERROR_IMAGE_LIST: fs
          .readdirSync(`${STATIC_DIR}/error_image`)
          .filter((f) => !INVALID_FILES.includes(f))
          .map((f) => `/error_image/${f}`),
        COVER_LIST: fs
          .readdirSync(`${STATIC_DIR}/cover`)
          .filter((f) => !INVALID_FILES.includes(f))
          .map((f) => `/cover/${f}`),
      }),
    }),
    new CopyPlugin({
      patterns: [
        {
          from: STATIC_DIR,
          to: path.join(__dirname, '../build'),
        },
      ],
    }),
    new HtmlPlugin({
      template: path.join(__dirname, '../src/index.html'),
    }),
  ],
};
