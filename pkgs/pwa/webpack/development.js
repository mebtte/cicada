const path = require('path');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

const base = require('./base');

module.exports = {
  ...base,
  mode: 'development',
  output: {
    path: path.join(__dirname, '../build'),
    filename: '[name].js',
    chunkFilename: '[name].js',
    publicPath: '/',
  },
  cache: {
    type: 'filesystem',
  },
  devtool: 'eval-cheap-module-source-map',
  plugins: [...base.plugins, new ForkTsCheckerWebpackPlugin()],
  devServer: {
    port: 8000,
    hot: true,
  },
};
