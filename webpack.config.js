//@ts-check

'use strict';

const path = require('path');
const webpack = require('webpack');
const extensionPackage = require('./package.json');

/**@type {import('webpack').Configuration}*/
const config = {
  target: 'webworker',
  entry: './src/extension.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'extension.js',
    libraryTarget: 'commonjs2',
    devtoolModuleFilenameTemplate: '../[resource-path]',
  },
  plugins: [
    new webpack.EnvironmentPlugin({
      EXTENSION_NAME: `${extensionPackage.publisher}.${extensionPackage.name}`,
      EXTENSION_VERSION: extensionPackage.version,
    }),
  ],
  devtool: 'source-map',
  externals: {
    vscode: 'commonjs vscode',
    'prettier-m': 'commonjs prettier-m',
  },
  resolve: {
    mainFields: ['browser', 'module', 'main'],
    extensions: ['.ts', '.js'],
    modules: ['node_modules'],
    alias: {
      // provides alternate implementation for node module and source files
    },
    fallback: {
      util: require.resolve('util/'),
      path: require.resolve('path-browserify'),
      child_process: false,
      fs: false,
      os: false,
      // Webpack 5 no longer polyfills Node.js core modules automatically.
      // see https://webpack.js.org/configuration/resolve/#resolvefallback
      // for the list of Node.js core module polyfills.
    },
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader',
          },
        ],
      },
      {
        loader: 'vscode-nls-dev/lib/webpack-loader',
        options: {
          base: path.join(__dirname, 'src'),
        },
      },
    ],
  },
};
module.exports = config;
