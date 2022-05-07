const path = require('path');
const webpack = require('webpack');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const base = require('./base');

module.exports = {
  ...base,
  watch: true,
  mode: 'development',
  target: 'node',
  output: {
    path: path.join(__dirname, '../build'),
    filename: 'index.js',
  },
  cache: {
    type: 'filesystem',
  },
  devtool: 'eval-cheap-module-source-map',
  plugins: [
    ...base.plugins,
    new ForkTsCheckerWebpackPlugin(),
    new webpack.DefinePlugin({
      __DEV__: JSON.stringify(true),
    }),
  ],
};
