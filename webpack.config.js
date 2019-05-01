/*jslint node: true*/
module.exports = {
    entry: {
        main: './js/main.js',
        style: './js/style.js',
        test: './tests/test.js'
    },
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
