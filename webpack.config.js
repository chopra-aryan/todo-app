const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = (env, argv) => {
  const isDev = argv.mode === 'development';

  return {
    entry: './src/js/index.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'bundle.[contenthash].js',
      clean: true,
    },
    devServer: {
      static: './dist',
      hot: true,
      port: 3000,
    },
    module: {
      rules: [
        {
          test: /\.css$/i,
          use: [
            isDev ? 'style-loader' : MiniCssExtractPlugin.loader,
            'css-loader',
          ],
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './src/index.html',
        title: 'Taskflow',
      }),
      ...(isDev ? [] : [new MiniCssExtractPlugin({ filename: 'styles.[contenthash].css' })]),
    ],
  };
};
