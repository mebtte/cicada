const path = require('path');
const WorkboxPlugin = require('workbox-webpack-plugin');
const base = require('./base');

module.exports = {
  ...base,
  mode: 'production',
  output: {
    path: path.join(__dirname, '../build'),
    filename: '[name]_[contenthash].js',
    chunkFilename: '[name]_[contenthash].js',
    publicPath: '/',
  },
  plugins: [
    ...base.plugins,
    new WorkboxPlugin.GenerateSW({
      mode: 'production',
      clientsClaim: true,
      skipWaiting: true,
      cleanupOutdatedCaches: true,
      disableDevLogs: true,
    }),
  ],
  devtool: 'nosources-source-map',
  optimization: {
    minimize: true,
  },
};
