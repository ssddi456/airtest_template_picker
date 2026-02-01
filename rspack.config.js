const path = require("path");
const rspack = require("@rspack/core");

const HtmlRspackPlugin = rspack.HtmlRspackPlugin;
const ReactRefreshRspackPlugin = require("@rspack/plugin-react-refresh");
const { codeInspectorPlugin } = require('code-inspector-plugin');

/**
 * @type {import("@rspack/core").Configuration}
 */
module.exports = {
    mode: "development",
    entry: {
        index: "./src/client/index.tsx",
    },
    optimization: {
        minimize: false,
        splitChunks: false,
        mangleExports: false,
    },
    output: {
        filename: "[name].js",
        path: path.resolve(__dirname, "dist"),
        publicPath: "http://localhost:3050/dist/",
    },
    plugins: [
        codeInspectorPlugin({
            bundler: 'rspack',
            hotKeys: ['altKey'],
            importClient: 'code',
            injectTo:[
                path.resolve(__dirname, 'src/client/index.tsx'),
            ]
        }),
        new HtmlRspackPlugin({
            template: "./src/client/index.html",
            filename: "index.html",
            chunks: ["index"],
        }),
        new ReactRefreshRspackPlugin(),
    ],
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                exclude: /node_modules/,
                use: {
                    loader: "builtin:swc-loader",
                    options: {
                        jsc: {
                            parser: {
                                syntax: "typescript",
                                tsx: true,
                            },
                            transform: {
                                react: {
                                    runtime: "automatic",
                                    development: true,
                                    refresh: true,
                                },
                            },
                        },
                    },
                },
            },
            {
                test: /\.css$/,
                use: [
                    
                    {
                        loader: "css-loader",
                        options: {
                            exportType: "css-style-sheet"
                        }
                    },
                    "postcss-loader",
                ],
            },
            {
                test: /\.md$/,
                type: "asset/source",
            },
        ],
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"],
    },
    devServer: {
        hot: true,
        port: 3000,
    },
    experiments: {
        cache: {
            type: "persistent",
            storage: {
                type: "filesystem",
                directory: path.resolve(__dirname, ".cache"),
            },
            buildDependencies: [
                __filename,
                path.resolve(__dirname, "package.json"),
                path.resolve(__dirname, "tsconfig.json"),
                path.resolve(__dirname, "postcss.config.js"),
                path.resolve(__dirname, "tailwind.config.js"),
            ],
        },
    },
};
