const path = require('path');
const cp = require('child_process');
const fs = require('fs-extra');
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlPlugin = require('html-webpack-plugin');

const INVALID_FILES = ['.DS_Store'];
const STATIC_DIR = path.join(__dirname, '../src/static');

module.exports = {
  entry: path.join(__dirname, '../src/index.tsx'),
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'ts-loader',
          },
        ],
        exclude: [/node_modules/],
      },
      {
        test: /\.js$/,
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
      '@': path.resolve(__dirname, '..', 'src'),
    },
    symlinks: false,
  },
  plugins: [
    new webpack.DefinePlugin({
      __CONFIG__: JSON.stringify({
        version: cp
          .execSync('git tag --sort=-taggerdate | head -n 1')
          .toString()
          .trim(),
        buildTime: new Date(),
        emptyImageList: fs
          .readdirSync(`${STATIC_DIR}/empty_image`)
          .filter((f) => !INVALID_FILES.includes(f))
          .map((f) => `/empty_image/${f}`),
        errorImageList: fs
          .readdirSync(`${STATIC_DIR}/error_image`)
          .filter((f) => !INVALID_FILES.includes(f))
          .map((f) => `/error_image/${f}`),
        coverList: fs
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
