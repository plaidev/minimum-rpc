// -*- coding: utf-8 -*-

const path = require('path');
const fs = require('fs');
const webpack = require('webpack');

module.exports = {
  mode: 'production',
  entry: {
    server: './lib/server.js',
    client: './lib/client.js'
  },
  output: {
    path: path.resolve('build'),
    libraryTarget: 'commonjs-module',
    umdNamedDefine: true,
    filename: '[name].js',
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
    }),
  ],
  optimization: {
  },
  resolve: {
    extensions: ['.js']
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: [
          'babel-loader'
        ]
      }
    ]
  },
  devtool: 'source-map',
  performance: {
    hints: false
  },
  node: {
    fs: 'empty'
  }
};
