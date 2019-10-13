/*jslint node: true*/

var entry = {
    main: './js/main.js',
    style: './js/style.js'
};

try {
    var qunit = require('qunit');
    if (qunit) {
        entry.test = './tests/test.js';
    }
} catch (e) {
    process.stdout.write('Could not load qunit: "' + e + '"\n');
    process.stdout.write("This is probably a production environment.\n");
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
