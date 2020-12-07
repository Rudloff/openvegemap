const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const FontminPlugin = require('fontmin-webpack');

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
        new OptimizeCssAssetsPlugin(),
        new FontminPlugin({
            autodetect: false,
            // Taken from https://fontawesome.com/cheatsheet.
            glyphs: [
                '\uf002', '\uf0b0', '\uf041', '\uf013', '\uf055', '\uf188', '\uf129', '\uf140',
                '\uf111', '\uf1ce', '\uf192', '\uf05e', '\uf0c9', '\uf128',
            ],
        }),
    ],
};
