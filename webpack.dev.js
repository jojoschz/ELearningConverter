/**
 * @project: E-Learning Konverter
 * @author: Johannes Schmitz
 * @description: Webpack-konfigurationsdatei für die Entwicklung 
 */

const webpack = require('webpack');
const path = require('path');

const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    mode: 'development', 
    devtool: 'eval-cheap-module-source-map',

    entry: './WEB/src/main.ts',

    output: {
        path: path.resolve('dist'),
        publicPath: 'http://localhost:8080/',
        filename: 'bundle.js'
    },

    resolve: {
        extensions: ['.ts', '.js']
    },

    plugins: [
        new MiniCssExtractPlugin({
            filename: "[name].css",
            chunkFilename: "[id].css"
        }),
        new HtmlWebpackPlugin({
            template: './WEB/src/index.html'
        })
    ],

    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader'
            },
            {
                test: /\.html$/,
                use: 'html-loader'
            },
            {
                test: /\.css$/i,
                use: [MiniCssExtractPlugin.loader, "css-loader"],
            }
        ]
    }
};