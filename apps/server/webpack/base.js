const path = require('path');
const webpack = require('webpack');

const pkg = require('../../../package.json');

module.exports = {
  entry: path.join(__dirname, '../src/index.ts'),
  module: {
    rules: [
      {
        test: /\.(j|t)s$/,
        use: ['babel-loader'],
        exclude: [/node_modules/],
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.json'],
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
      }),
    }),
  ],
  experiments: {
    topLevelAwait: true,
  },
};
