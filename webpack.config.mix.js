/* global module, __dirname */

// -- modules
var fs = require("fs");
var path = require("path");
var webpack = require("webpack");
var header = require("string-template");

// -- plugins
var DefineWebpackPlugin = webpack.DefinePlugin;
var ExtractTextWebPackPlugin = require("extract-text-webpack-plugin");
var BannerWebPackPlugin = webpack.BannerPlugin;
var UglifyJsWebPackPlugin = webpack.optimize.UglifyJsPlugin;
var ReplaceWebpackPlugin = require("replace-bundle-webpack-plugin");

// -- performances
var SpeedMeasurePlugin = require("speed-measure-webpack-plugin");
var smp = new SpeedMeasurePlugin();

// -- variables
var date = new Date().toISOString().split("T")[0];
var pkg = require(path.join(__dirname, "package.json"));

module.exports = env => {
    // environnement d'execution
    var production = (env) ? env.production : false;
    var development = (env) ? env.development : false;

    var _mode = (production) ? "" : (development) ? "-map" : "-src";

    return smp.wrap({
        entry : path.join(__dirname, "src", "Mix", "GpPluginOlItowns"),
        output : {
            path : path.join(__dirname, "dist", "mix"),
            filename : "GpPluginOlItowns" + _mode + ".js",
            library : "Gp",
            libraryTarget : "umd",
            umdNamedDefine : true
        },
        resolve : {
            alias : {
                gp : path.resolve(__dirname, "node_modules", "geoportal-access-lib", "dist", (production) ? "GpServices.js" : "GpServices-src.js"),
                proj4 : path.resolve(__dirname, "node_modules", "proj4", "dist", (production) ? "proj4.js" : "proj4-src.js"),
                sortable : path.resolve(__dirname, "node_modules", "sortablejs", (production) ? "Sortable.min.js" : "Sortable.js")
            }
        },
        externals : {
            itowns : {
                commonjs2 : "itowns",
                commonjs : "itowns",
                amd : "itowns",
                root : "itowns"
            },
            ol : {
                commonjs : "openlayers",
                commonjs2 : "openlayers",
                amd : "ol",
                root : "ol"
            },
            request : {
                commonjs2 : "request",
                commonjs : "request",
                amd : "require"
            },
            xmldom : {
                commonjs2 : "xmldom",
                commonjs : "xmldom",
                amd : "require"
            }
        },
        devtool : (development) ? "eval-source-map" : false,
        module : {
            rules : [
                {
                    test : /\.js$/,
                    include : [
                        path.join(__dirname, "src", "Common"),
                        path.join(__dirname, "src", "OpenLayers"),
                        path.join(__dirname, "src", "Itowns")
                    ],
                    exclude : /node_modules/,
                    use : {
                        loader : "babel-loader",
                        options : {
                            presets : ["env"]
                        }
                    }
                },
                // {
                //     test : /\.js$/,
                //     enforce : "pre",
                //     include : [
                //         path.join(__dirname, "src", "Common"),
                //         path.join(__dirname, "src", "OpenLayers"),
                //         path.join(__dirname, "src", "Itowns")
                //     ],
                //     exclude : /node_modules/,
                //     use : [
                //         {
                //             loader : "eslint-loader",
                //             options : {
                //                 emitWarning : true
                //             }
                //         }
                //     ]
                // },
                {
                    test : /\.css$/,
                    include : [
                        path.join(__dirname, "res", "Common"),
                        path.join(__dirname, "res", "OpenLayers"),
                        path.join(__dirname, "res", "Itowns")
                    ],
                    use : ExtractTextWebPackPlugin.extract({
                        fallback : {
                            loader : "style-loader",
                            options : {
                                sourceMap : false
                            }
                        },
                        use : {
                            loader : "css-loader",
                            options : {
                                sourceMap : true, // FIXME ?
                                minimize : (production) ? true : false
                            }
                        }
                    })
                },
                {
                    test : /\.(png|jpg|gif|svg)$/,
                    loader : "url-loader"
                }
            ]
        },
        plugins : [
            /** REPLACEMENT DE VALEURS */
            new ReplaceWebpackPlugin(
                [
                    {
                        partten : /__GPITOWNSEXTVERSION__/g,
                        /** replacement de la clef __GPVERSION__ par la version du package */
                        replacement : function () {
                            return pkg.itownsExtVersion;
                        }
                    },
                    {
                        partten : /__GPOLEXTVERSION__/g,
                        /** replacement de la clef __GPVERSION__ par la version du package */
                        replacement : function () {
                            return pkg.olExtVersion;
                        }
                    },
                    {
                        partten : /__GPDATE__/g,
                        /** replacement de la clef __GPDATE__ par la date du build */
                        replacement : function () {
                            return date;
                        }
                    }
                ]
            ),
            /** GESTION DU LOGGER */
            new DefineWebpackPlugin({
                __PRODUCTION__ : JSON.stringify(production)
            }),
            /** CSS / IMAGES */
            new ExtractTextWebPackPlugin("GpPluginOlItowns" + _mode + ".css")
        ]
        /** MINIFICATION */
        .concat(
            (production) ? [
                new UglifyJsWebPackPlugin({
                    output : {
                        comments : false,
                        beautify : false
                    },
                    uglifyOptions : {
                        mangle : true,
                        warnings : false,
                        compress : false
                    }
                })] : []
        )
        /** AJOUT DES LICENCES */
        .concat([
            new BannerWebPackPlugin({
                banner : fs.readFileSync(path.join(__dirname, "licences", "licence-proj4js.txt"), "utf8"),
                raw : true
            }),
            new BannerWebPackPlugin({
                banner : fs.readFileSync(path.join(__dirname, "licences", "licence-es6promise.txt"), "utf8"),
                raw : true
            }),
            new BannerWebPackPlugin({
                banner : fs.readFileSync(path.join(__dirname, "licences", "licence-sortable.txt"), "utf8"),
                raw : true
            }),
            new BannerWebPackPlugin({
                banner : header(fs.readFileSync(path.join(__dirname, "licences", "licence-ign.tmpl"), "utf8"), {
                    __BRIEF__ : pkg.olItownsExtName,
                    __VERSION__ : pkg.olItownsExtVersion,
                    __DATE__ : date
                }),
                raw : true,
                entryOnly : true
            })
        ])
    });
};
