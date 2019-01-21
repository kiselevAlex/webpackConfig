//PLUGINS
const HtmlBeautifyPlugin = require('html-beautify-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const _StyleLintPlugin = require('stylelint-webpack-plugin');
const ImageminPlugin = require('imagemin-webpack-plugin').default;
const CleanWebpackPlugin = require('clean-webpack-plugin');
const ProgressBarPlugin = require('progress-bar-webpack-plugin');

//CONST
const path = require('path');
const argv = require('yargs').argv;
const isDevelopment = argv.mode === 'development';
const distPath = path.resolve(__dirname, 'build');
const functions = require('./webpack.function');
const pages = functions.generateHtmlPlugins(path.resolve(__dirname, './src/pages'), ['./build']);
const layouts = functions.generateHtmlPlugins(path.resolve(__dirname, './src/layouts'), ['./../', './build']);
const components = functions.generateHtmlPlugins(path.resolve(__dirname, './src/components'), ['./build']);
const bootstrap_preview = functions.generateHtmlPlugins(path.resolve(__dirname, './src/bootstrap_preview'), ['./build']);
const htmlPlugins = pages.plugins.concat(layouts.plugins).concat(components.plugins).concat(bootstrap_preview.plugins);
const entryScss = Object.assign(pages.entry, layouts.entry, components.entry, bootstrap_preview.entry);
const extractCSS = new ExtractTextPlugin('css/index.css');
const extractBootstrap = new ExtractTextPlugin('bootstrap/bootstrap.css');

//
// CSS loader config
//
let ccsConfig = [];
ccsConfig.push(functions.getCssConfig(extractCSS, /index\.scss$/));
ccsConfig.push(functions.getCssConfig(extractBootstrap, /bootstrap\.scss/));
let extract = [extractCSS, extractBootstrap];
extract = extract.concat(Object.keys(entryScss).map(function(el){
    let p = entryScss[el].replace(/(.*)src\\/, "");
    let ext = new ExtractTextPlugin(p.split("\\").join("/").replace(".scss", ".css"));
    ccsConfig.push(functions.getCssConfig(ext, new RegExp(p.split("\\").join("\\\\")+"$")));
    return ext;
}));

const config = {
    mode: argv.mode,
    stats: {
        children: false,
        modules: false,
    },
    performance: {
        hints: false,
        maxAssetSize: 1000000
    },
    entry: Object.assign({
        _start: './src/js/_start.js',
        sprite_svg: './src/js/sprite_svg.js',
        index: './src/scss/index.scss',
        bootstrap: './src/bootstrap/scss/bootstrap.scss'
    }, entryScss),
    output: {
        filename: (chunkData) => {
            switch (chunkData.chunk.name) {
                case 'bootstrap':
                    return 'bootstrap/bootstrap.css';
                case 'index':
                    return 'css/[name].css';
                default:
                    if (/^(\$)/.test(chunkData.chunk.name) && entryScss[chunkData.chunk.name]) {
                        return entryScss[chunkData.chunk.name].replace(/(.*)src\\/, "").split("\\").join("/").replace('.scss', '.css');
                    }
                    return 'js/[name].js'
            }
        },
        path: distPath
    },
    resolve: {
        extensions: ['*', '.js', '.vue', '.json', '.pug']
    },
    module: {
        rules: [{
            test: /\.pug$/,
            use: [
                {
                    loader: "pug-loader",
                    options: {
                        pretty: true
                    }
                }
            ]
        }, {
            test: /\.(eot|ttf|woff|woff2)$/,
            use: {
                loader: 'file-loader',
                options: {
                    name: distPath + '/fonts/[name][hash].[ext]'
                }
            }
        }, {
            test: /\.svg$/,
            use: [
                'svg-sprite-loader',
                {
                    loader: 'svgo-loader',
                    options: {
                        plugins: [
                            {removeTitle: true},
                            {convertColors: {shorthex: false}},
                            {removeAttrs: { attrs: '(fill|stroke)' }}
                        ]
                    }
                }
            ],
        }].concat(ccsConfig)
    },
    devtool: isDevelopment ? 'inline-source-map' : false,
    plugins: [
        new ProgressBarPlugin(),
        new CopyWebpackPlugin([{
            from: './src/css',
            to: distPath + '\\css\\lib'
        }, {
            from: './src/img',
            to: distPath + '\\img'
        }
        ]),
        new ImageminPlugin({
            test: /\.(jpe?g|png|gif)$/i,
            disable: isDevelopment
        }),
        new _StyleLintPlugin({
            configFile: path.resolve(__dirname, 'stylelint.config.js'),
            context: path.resolve(__dirname, './src'),
            files: ['scss/*.scss', 'bootstrap/*.scss'],
            failOnError: false,
            quiet: false,
        })
    ].concat(htmlPlugins, extract)
        .concat(isDevelopment ? [] : [new HtmlBeautifyPlugin(), new CleanWebpackPlugin(distPath, {})]),
    optimization: {
        minimize: !isDevelopment
    },
    devServer: {
        contentBase: distPath,
        port: 9009,
        compress: true,
        open: true
    }
};

module.exports = config;