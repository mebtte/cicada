const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const { mainConfig, serviceWorkerConfig } = require('./base');

const cache = {
  type: 'filesystem',
};

module.exports = [
  {
    ...serviceWorkerConfig,
    cache,
    devtool: 'eval-cheap-module-source-map',
    plugins: [...serviceWorkerConfig.plugins, new ForkTsCheckerWebpackPlugin()],
  },
  {
    ...mainConfig,
    cache,
    devtool: 'eval-cheap-module-source-map',
    plugins: [...mainConfig.plugins, new ForkTsCheckerWebpackPlugin()],
    devServer: {
      port: 8001,
      hot: true,
    },
  },
];
