/* eslint-disable import/extensions */
import url from 'url';
import path from 'path';
import webpack from 'webpack';
import WorkboxPlugin from 'workbox-webpack-plugin';
import { mainConfig } from './base.js';

const CURRENT_DIR = path.dirname(url.fileURLToPath(import.meta.url));

export default {
  ...mainConfig,
  plugins: [
    ...mainConfig.plugins,
    new WorkboxPlugin.InjectManifest({
      compileSrc: true,
      swSrc: path.join(CURRENT_DIR, '../src/service_worker.ts'),
      swDest: 'service_worker.js',
    }),
    new webpack.DefinePlugin({
      'process.env.WITH_SW': JSON.stringify(true),
    }),
  ],
  devtool: 'nosources-source-map',
  optimization: {
    minimize: true,
  },
};
