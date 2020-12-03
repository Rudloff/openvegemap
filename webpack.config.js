const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');

const entry = {
    main: './js/main.js',
    style: './js/style.js'
};

try {
    const qunit = require('qunit');
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
    stats: 'minimal',
    optimization: {
        runtimeChunk: 'single',
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                loader: [
                    {
                        loader: MiniCssExtractPlugin.loader,
                        options: {
                            publicPath: './',
                        },
                    },
                    'css-loader',
                ],
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
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: 'templates/index.html',
            filename: '../index.html',
            scriptLoading: 'defer',
            inject: 'head',
            excludeChunks: ['test']
        }),
        new HtmlWebpackPlugin({
            template: 'templates/tests.html',
            filename: '../tests/index.html',
            publicPath: '../dist/',
            inject: 'head',
            chunks: ['test']
        }),
        new MiniCssExtractPlugin(),
        new OptimizeCssAssetsPlugin()
    ],
};
