const webpack = require('webpack');
const { devMainConfig } = require('./base');

module.exports = {
  ...devMainConfig,
  plugins: [
    ...devMainConfig.plugins,
    new webpack.DefinePlugin({
      'process.env.WITH_SW': JSON.stringify(false),
    }),
  ],
};
