const path = require('path');
const webpack = require('webpack');
const WorkboxPlugin = require('workbox-webpack-plugin');
const { mainConfig } = require('./base');

module.exports = {
  ...mainConfig,
  plugins: [
    ...mainConfig.plugins,
    new WorkboxPlugin.InjectManifest({
      compileSrc: true,
      swSrc: path.join(__dirname, '../src/service_worker.ts'),
      swDest: path.join(__dirname, '../build/service_worker.js'),
    }),
    new webpack.DefinePlugin({
      __WITH_SW__: JSON.stringify(true),
    }),
  ],
  devtool: 'nosources-source-map',
  optimization: {
    minimize: true,
  },
};
