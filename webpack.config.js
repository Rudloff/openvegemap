/*jslint node: true*/
var webpack = require('webpack');

module.exports = {
    entry: './js/map.js',
    output: {
        filename: 'dist/map.js'
    },
    plugins: [
        new webpack.optimize.UglifyJsPlugin()
    ]
};
