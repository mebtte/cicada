const webpack = require('webpack');
const { devMainConfig } = require('./base');

module.exports = {
  ...devMainConfig,
  plugins: [
    ...devMainConfig.plugins,
    new webpack.DefinePlugin({
      __WITH_SW__: JSON.stringify(false),
    }),
  ],
};
