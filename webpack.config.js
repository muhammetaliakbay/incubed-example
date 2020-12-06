const webpack = require('webpack');
const path = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

const resolve = {
    extensions: [
        '.tsx', '.ts', '.js', '.json'
    ]
}

const commons = {
    optimization: {
        // splitChunks: false,
        // runtimeChunk: 'single',
        sideEffects: false
    },
    // stats: 'verbose',
    resolve,
    externals: [
        'electron commonjs'
    ]
};


module.exports = [
    {
        name: 'boot',

        ...commons,
        externals: [
            'electron commonjs'
        ],

        entry: './src/ui/electron-main.ts',

        output: {
            path: path.resolve('./bundle'),
            filename: "boot.js"
        },
        devtool: 'cheap-source-map',

        target: 'electron-main',
        node: {
            __filename: true,
            __dirname: true,
            global: false
        },

        module: {
            rules: [{
                test: /\.ts$/,
                loader: require.resolve('ts-loader')
            }],
        },

        plugins: [
            new webpack.optimize.LimitChunkCountPlugin({
                maxChunks: 1,
            })
        ]
    },
    {
        name: 'ui',

        ...commons,

        entry: './src/ui/index.tsx',

        output: {
            path: path.resolve('./bundle'),
            filename: "ui.js"
        },
        devtool: 'cheap-source-map',

        target: 'electron-renderer',
        node: {
            __filename: true,
            __dirname: true,
            global: false
        },

        module: {
            rules: [{
                test: /\.ts[x]?$/,
                loader: require.resolve('ts-loader')
            },{
                test: /\.(sa|sc|c)ss$/,
                use: [require.resolve('style-loader'), require.resolve('css-loader'), require.resolve('sass-loader')]
            }, {
                test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
                use: [
                    {
                        loader: require.resolve('file-loader'),
                        options: {
                            name: '[name].[ext]',
                            outputPath: 'fonts/'
                        }
                    }
                ]
            }],
        },

        plugins: [
            new webpack.optimize.LimitChunkCountPlugin({
                maxChunks: 1,
            }),
            new HtmlWebpackPlugin({
                filename: 'index.html',
                template: './src/ui/index.html'
            }),
            new CopyPlugin({
                patterns: [
                    {
                        from: 'src/ui/assets',
                        to: 'assets'
                    },
                ],
            })
        ]
    }
];
