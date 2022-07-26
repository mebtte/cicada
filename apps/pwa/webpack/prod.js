const path = require('path');
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
  ],
  devtool: 'nosources-source-map',
  optimization: {
    minimize: true,
  },
};
