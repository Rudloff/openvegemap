const HtmlWebpackPlugin = require('html-webpack-plugin');
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const FontminPlugin = require('fontmin-webpack');

/** @var {any} MiniCssExtractPlugin*/
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

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
        filename: '[name].[fullhash].bundle.js',
        publicPath: 'dist/',
        clean: true
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
                use: [
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
                type: 'asset/resource'
            },
            {
                test: /\.(png|gif)$/,
                type: 'asset/resource'
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
        new MiniCssExtractPlugin({
            filename: '[name].[fullhash].css',
        }),
        new CssMinimizerPlugin(),
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
