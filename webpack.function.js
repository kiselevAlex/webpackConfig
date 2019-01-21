const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const fs = require('fs');

function generateHtmlPlugins(templateDir, dir) {
    const templateFiles = fs.readdirSync(templateDir);
    let plugins = [];
    let entry = {};
    templateFiles.forEach(item => {
        const parts = item.split('.');
        const name = parts[0];
        if (name[0] !== '_') {
            const stat = fs.lstatSync(templateDir + "\\" + item);
            if (stat.isFile() && /\.pug$/.test(item)) {
                const extension = parts[1];
                dir.forEach(d => {
                    let chunks = ['bootstrap', 'index', '_start', 'sprite_svg'];
                    if (entry['$' + name] != undefined) chunks.push('$' + name);
                    plugins.push(new HtmlWebpackPlugin({
                        filename: path.resolve(__dirname, d) + templateDir.replace(__dirname + '\\src', "") + `\\${name}.html`,
                        template: templateDir + `\\${name}.${extension}`,
                        inject: 'head',
                        chunksSortMode: 'none',
                        chunks: chunks,
                        minify: false
                    }))
                });
            } else if (stat.isFile() && /\.scss$/.test(item)) {
                entry['$' + name] = (templateDir + `\\${item}`).replace(/\\/, "/");
            }
            if (stat.isDirectory()) {
                let r = generateHtmlPlugins(templateDir + "\\" + item, dir)
                plugins = plugins.concat(r.plugins);
                entry = Object.assign(entry, r.entry);
            }
        }
    });
    return {
        plugins: plugins,
        entry: entry
    };
};

exports.generateHtmlPlugins = generateHtmlPlugins;

exports.getCssConfig = function(extract, reg) {
    return {
        test: reg,
        use: extract.extract({
            use: [{
                loader: 'css-loader',
                options: {importLoaders: 1},
            }, {
                loader: 'postcss-loader',
                options: {
                    config: {
                        path: __dirname + '/postcss.config.js'
                    }
                },
            }, {
                loader: 'sass-loader'
            }],
            fallback: 'style-loader'
        })
    };
};