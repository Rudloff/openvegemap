/*jslint node: true*/
var webpack = require('webpack');

module.exports = {
    entry: ['./js/main.js', './css/map.css'],
    output: {
        filename: 'dist/bundle.js'
    },
    module: {
        loaders: [
            {
                test: /\.css$/,
                loader: ["style-loader", "css-loader?minimize=true"]
            },
            {
                test: /\.(eot|svg|ttf|woff|woff2)$/,
                loader: 'file-loader?name=dist/fonts/[name].[ext]'
            },
            {
                test: /\.(png|gif)$/,
                loader: 'file-loader?name=dist/img/[name].[ext]'
            }
        ]
    },
    plugins: [
        new webpack.optimize.UglifyJsPlugin()
    ]
};
