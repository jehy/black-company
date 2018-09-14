const webpackProd = require('./webpack.prod');

const webpack = {prod: webpackProd};

module.exports = env => webpack[env];
