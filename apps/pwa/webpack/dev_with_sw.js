/* eslint-disable import/extensions */
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import webpack from 'webpack';
import { devMainConfig, serviceWorkerConfig } from './base.js';

export default [
  {
    ...devMainConfig,
    plugins: [
      ...devMainConfig.plugins,
      new webpack.DefinePlugin({
        'process.env.WITH_SW': JSON.stringify(true),
      }),
    ],
  },
  {
    ...serviceWorkerConfig,
    cache: {
      type: 'filesystem',
    },
    devtool: 'eval-cheap-module-source-map',
    plugins: [...serviceWorkerConfig.plugins, new ForkTsCheckerWebpackPlugin()],
  },
];
