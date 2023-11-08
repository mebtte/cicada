import path from 'path';
import url from 'url';
import fs from 'fs';
import cp from 'child_process';
import webpack from 'webpack';
import CopyPlugin from 'copy-webpack-plugin';
import HtmlPlugin from 'html-webpack-plugin';
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';

const CURRENT_DIR = path.dirname(url.fileURLToPath(import.meta.url));
const INVALID_FILES = ['.DS_Store'];
const STATIC_DIR = path.join(CURRENT_DIR, '../src/static');
const experiments = {
  topLevelAwait: true,
};

const envDefinePlugin = new webpack.DefinePlugin({
  __DEFINE__: JSON.stringify({
    VERSION: cp
      .execSync('git describe --abbrev=0 --tags')
      .toString()
      .replace('\n', ''),

    BUILD_TIME: new Date(),
    EMPTY_IMAGE_LIST: fs
      .readdirSync(`${STATIC_DIR}/empty_image`)
      .filter((f) => !INVALID_FILES.includes(f))
      .map((f) => `/empty_image/${f}`),
    ERROR_IMAGE_LIST: fs
      .readdirSync(`${STATIC_DIR}/error_image`)
      .filter((f) => !INVALID_FILES.includes(f))
      .map((f) => `/error_image/${f}`),
  }),
});

const mainConfig = {
  mode: process.env.NODE_ENV,
  experiments,
  entry: path.join(CURRENT_DIR, '../src/index.tsx'),
  output: {
    path: path.join(CURRENT_DIR, '../../../dist/pwa'),
    filename: '[name]_[contenthash].js',
    chunkFilename: 'chunk_[name]_[contenthash].js',
    publicPath: '/',
    clean: true,
  },
  module: {
    rules: [
      {
        /**
         * https://github.com/pmndrs/react-spring/issues/2097
         * @author mebtte<hi@mebtte.com>
         */
        test: /\.m?js/,
        resolve: {
          fullySpecified: false,
        },
      },
      {
        test: /\.(j|t)sx?$/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              rootMode: 'upward',
            },
          },
        ],
        exclude: [/node_modules/],
      },
      {
        test: /\.s?css$/,
        use: ['style-loader', 'css-loader', 'sass-loader'],
      },
      {
        test: /\.(jpe?g|png|svg|gif)$/,
        type: 'asset/resource',
      },
    ],
  },

  /**
   * https://github.com/aadsm/jsmediatags/issues/116
   * @author mebtte<hi@mebtte.com>
   */
  externals: { fs: true, 'react-native-fs': true },

  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    alias: {
      '@': path.resolve(CURRENT_DIR, '../src'),
      '#': path.resolve(CURRENT_DIR, '../../../shared'),
    },
    symlinks: false,
  },
  plugins: [
    envDefinePlugin,
    new CopyPlugin({
      patterns: [STATIC_DIR],
    }),
    new HtmlPlugin({
      template: path.join(CURRENT_DIR, '../src/index.html'),
    }),
  ],
};

const serviceWorkerConfig = {
  mode: process.env.NODE_ENV,
  experiments,
  target: 'webworker',
  entry: path.join(CURRENT_DIR, '../src/service_worker.ts'),
  output: {
    path: path.join(CURRENT_DIR, '../../../pwa'),
    filename: 'service_worker.js',
    publicPath: '/',
  },
  module: {
    rules: [
      {
        test: /\.(j|t)s?$/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              rootMode: 'upward',
            },
          },
        ],
        exclude: [/node_modules/],
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@': path.resolve(CURRENT_DIR, '../src'),
      '#': path.resolve(CURRENT_DIR, '../../../shared'),
    },
    symlinks: false,
  },
  plugins: [envDefinePlugin],
};

const devMainConfig = {
  ...mainConfig,
  cache: {
    type: 'filesystem',
  },
  devtool: 'eval-cheap-module-source-map',
  plugins: [...mainConfig.plugins, new ForkTsCheckerWebpackPlugin()],
  devServer: {
    port: 8001,
  },
};

export { mainConfig, devMainConfig, serviceWorkerConfig };
