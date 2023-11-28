/* eslint-disable import/extensions */
import webpack from 'webpack';
import { devMainConfig } from './base.js';

export default {
  ...devMainConfig,
  plugins: [
    ...devMainConfig.plugins,
    new webpack.DefinePlugin({
      'process.env.WITH_SW': JSON.stringify(false),
    }),
  ],
};
