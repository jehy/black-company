const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const {BundleAnalyzerPlugin} = require('webpack-bundle-analyzer');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const fs = require('fs');
const moment = require('moment');
const pages = require('./config/pages');

function getLinkPath(filename) {
  return `${filename}.html`;
}

const links = pages.map(page => `<li><a href="${getLinkPath(page.filename)}">${page.name}</a></li>`).join('');

const plugins = [
  new webpack.ProvidePlugin({$: 'jquery', jQuery: 'jquery' }),
  new BundleAnalyzerPlugin({analyzerMode: 'static', openAnalyzer: false}),
  new ExtractTextPlugin('styles.css'),
  new webpack.LoaderOptionsPlugin({
    minimize: true,
    debug: false,
  }),
  new CleanWebpackPlugin(['dist']),
];

pages.forEach((page)=>{
  page.content = fs.readFileSync(`pages/${page.filename}.html`, {encoding: 'utf8'});
});

pages.push({content: 'Пожалуйста, выберите нужную статью из ссылок справа', filename: 'index', name: 'Чёрный отряд 2018'});

pages.forEach((page)=>{
  const addPlugin = new HtmlWebpackPlugin({
    template: './src/index.ejs',
    inject: true,
    hash: true,
    cache: false,
    filename: `${page.filename}.html`,
    title: page.name,
    content: page.content,
    updated: moment().format('YYYY-MM-DD HH:mm'),
    links,
  });
  plugins.push(addPlugin);
});

module.exports = {
  entry: './src/js/index.js',
  devtool: 'source-map',
  cache: true,
  mode: 'production',
  optimization: {
    minimizer: [
      new UglifyJsPlugin({
        cache: true,
        parallel: true,
        sourceMap: true,
      }),
    ],
  },
  plugins,
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  node: {
    tls: 'empty',
    fs: 'empty',
    net: 'empty',
    console: true,
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['env'],
          },
        },
      },
      {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: 'css-loader',
        }),
      },
      {
        test: /\.(png|svg|jpg|gif)$/,
        use: [
          'file-loader',
        ],
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        use: [
          'file-loader',
        ],
      },
    ],
  },
};
