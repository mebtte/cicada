const path = require('path');
const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');
const cp = require('child_process');

module.exports = {
  mode: 'production',
  experiments: {
    topLevelAwait: true,
  },
  target: 'node',
  entry: path.join(__dirname, './src/index.ts'),
  output: {
    path: path.join(__dirname, '../../dist'),
    filename: 'cli.js',
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
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
  plugins: [
    new webpack.DefinePlugin({
      'globalThis.CICADA_VERSION': JSON.stringify(
        cp
          .execSync('git describe --abbrev=0 --tags')
          .toString()
          .replace('\n', ''),
      ),
      'globalThis.BUILT': JSON.stringify(true),
    }),
  ],
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@': path.resolve(__dirname, './src'),
      '#': path.resolve(__dirname, '../../shared'),
    },
    symlinks: false,
  },
  externals: [
    nodeExternals({
      additionalModuleDirs: [path.join(__dirname, '../../node_modules')],
    }),
  ],
};
