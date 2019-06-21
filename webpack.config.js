/*jslint node: true*/

try {
    var qunit = require('qunit');
} catch (e) {
    console.log("This is a production environment.");
}

var entry = {
    main: './js/main.js',
    style: './js/style.js'
};

if (qunit) {
    entry.test = './tests/test.js';
}

module.exports = {
    entry: entry,
    output: {
        filename: '[name].bundle.js',
        publicPath: 'dist/'
    },
    mode: 'production',
    module: {
        rules: [
            {
                test: /\.css$/,
                loader: ["style-loader", "css-loader"]
            },
            {
                test: /\.(eot|svg|ttf|woff|woff2)$/,
                loader: 'file-loader',
                options: {
                    name: 'fonts/[name].[ext]'
                }
            },
            {
                test: /\.(png|gif)$/,
                loader: 'file-loader',
                options: {
                    name: 'img/[name].[ext]'
                }
            }
        ]
    }
};
