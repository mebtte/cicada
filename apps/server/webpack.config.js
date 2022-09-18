const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  mode: 'production',
  experiments: {
    topLevelAwait: true,
  },
  target: 'node',
  entry: path.join(__dirname, './src/index.ts'),
  output: {
    path: path.join(__dirname, '../..'),
    filename: 'index.js',
    // chunkFilename: 'chunk_[name]_[contenthash].js',
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
