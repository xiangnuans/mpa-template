const path = require("path");
const fs = require("fs");
const lessToJs = require("less-vars-to-js");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CracoLessPlugin = require("craco-less");
const { when, whenDev } = require("@craco/craco");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
const TerserPlugin = require("terser-webpack-plugin");
const fastRefreshCracoPlugin = require("craco-fast-refresh");
const AntdDayjsWebpackPlugin = require("antd-dayjs-webpack-plugin");

const isBuildAnalyzer = process.env.BUILD_ANALYZER === "true";

const readFile = (filename) => {
  if (!fs.existsSync(filename)) return false;
  return fs.readFileSync(filename, "utf8");
};

const configureWebpack = (webpackConfig, { env, paths }) => {
  const isProd = process.env.NODE_ENV === "production";
  const mHtmlWebpackPlugin = (chunks, filename, template) => {
    return new HtmlWebpackPlugin({
      inject: true,
      template: template || paths.appHtml,
      chunks,
      filename,
      ...(isProd
        ? {
            minify: {
              removeComments: true,
              collapseWhitespace: true,
              removeRedundantAttributes: true,
              useShortDoctype: true,
              removeEmptyAttributes: true,
              removeStyleLinkTypeAttributes: true,
              keepClosingSlash: true,
              minifyJS: true,
              minifyCSS: true,
              minifyURLs: true,
            },
          }
        : undefined),
    });
  };

  const entriesDir = path.join(paths.appSrc, "entries");
  const fileNames = fs.readdirSync(entriesDir);
  const entries = {};
  const htmlWebpackPlugins = [];
  fileNames.forEach((fileName) => {
    const filePath = path.join(entriesDir, fileName);
    const file = fs.statSync(filePath);
    if (file.isDirectory()) {
      entries[fileName] = [path.join(filePath, "index.tsx")].filter(Boolean);
      let template = path.join(paths.appPublic, fileName + ".html");
      if (!fs.existsSync(template)) template = undefined;
      htmlWebpackPlugins.push(
        mHtmlWebpackPlugin([fileName], fileName + ".html", template)
      );
    }
  });
  webpackConfig.entry = {
    main: webpackConfig.entry,
    lib: ["react", "react-dom"],
    ...entries,
  };
  webpackConfig.output = {
    path: isProd ? paths.appBuild : undefined,
    filename: isProd
      ? "static/js/[name].[contenthash:8].js"
      : "static/[name]/bundle.js",
    futureEmitAssets: true,
    chunkFilename: isProd
      ? "static/js/[name].[contenthash:8].chunk.js"
      : "static/js/[name].chunk.js",
    publicPath: isProd ? paths.servedPath : "/",
    devtoolModuleFilenameTemplate: isProd
      ? (info) =>
          path
            .relative(paths.appSrc, info.absoluteResourcePath)
            .replace(/\\/g, "/")
      : (info) => path.resolve(info.absoluteResourcePath).replace(/\\/g, "/"),
    jsonpFunction: `webpackJsonp${paths.appPackageJson.name}`,
  };
  const defaultHtmlWebpackPluginIndex = webpackConfig.plugins.findIndex(
    (plugin) => plugin instanceof HtmlWebpackPlugin
  );
  webpackConfig.plugins.splice(
    defaultHtmlWebpackPluginIndex,
    1,
    mHtmlWebpackPlugin(["main"], "index.html"),
    ...htmlWebpackPlugins
  );
  webpackConfig.resolve.extensions = [
    ...webpackConfig.resolve.extensions,
    ...[".scss", ".less"],
  ];
  webpackConfig.resolve.plugins = [
    ...webpackConfig.resolve.plugins,
    ...[
      new TsconfigPathsPlugin({
        extensions: [".ts", ".tsx", ".js", ".jsx"],
        configFile: path.resolve(__dirname, "tsconfig.json"),
      }),
    ],
  ];
  webpackConfig.optimization.minimizer.map((plugin) => {
    if (plugin instanceof TerserPlugin) {
      Object.assign(plugin.options.terserOptions.compress, {
        drop_debugger: shouldDropDebugger, // 删除 debugger
        drop_console: shouldDropConsole, // 删除 console
      });
    }
    return plugin;
  });
  webpackConfig.optimization.splitChunks = {
    ...webpackConfig.optimization.splitChunks,
    ...{
      chunks: "all",
      name: true,
    },
  };
  webpackConfig.externals = {
    react: "React",
    "react-dom": "ReactDOM",
  };
  // TODO
  return webpackConfig;
};

const configureDevServer = (devServerConfig, { env, paths }) => {
  devServerConfig.historyApiFallback = {
    disableDotRule: true,
    index: paths.publicUrlOrPath,
    verbose: true,
  };
  if (env === "development") {
    devServerConfig.proxy = {
      "/auth": {
        target: "https://xxxx.cn",
        changeOrigin: true,
      },
    };
  }
  return devServerConfig;
};

const config = {
  babel: {
    loaderOptions: {
      exclude: [
        /node_modules[\\/]core-js/,
        /node_modules[\\/]react-app-polyfill/,
      ],
    },
    presets: [
      [
        "@babel/preset-env",
        {
          modules: false,
          useBuiltIns: "entry",
          corejs: {
            version: 3,
            proposals: true,
          },
        },
      ],
    ],
    plugins: [
      [
        "import",
        {
          libraryName: "@leke/rc",
          libraryDirectory: "es",
          camel2DashComponentName: false,
          style(name) {
            return `${name}/index.less`.replace("/es/", "/style/");
          },
        },
        "@leke/rc",
      ],
      [
        "import",
        {
          libraryName: "antd",
          style: true,
        },
        "antd",
      ],
    ],
  },
  plugins: [
    new AntdDayjsWebpackPlugin(),
    ...whenDev(
      () => [
        {
          plugin: fastRefreshCracoPlugin,
        },
      ],
      []
    ),
    {
      plugin: CracoLessPlugin,
      options: {
        modifyLessRule(lessRule) {
          return {
            ...lessRule,
            ...{
              test: /\.less$/,
              exclude: /\.module\.less$/,
            },
          };
        },
        lessLoaderOptions: {
          lessOptions: {
            modifyVars: lessToJs(
              readFile(path.resolve(__dirname, "src/styles/themes/index.less"))
            ),
            javascriptEnabled: true,
          },
        },
      },
    },
    {
      plugin: CracoLessPlugin,
      options: {
        modifyLessRule(lessRule) {
          return {
            ...lessRule,
            ...{
              test: /\.module\.less$/,
              exclude: undefined,
            },
          };
        },
      },
    },
  ],
  webpack: {
    plugins: [...when(isBuildAnalyzer, () => [new BundleAnalyzerPlugin()], [])],
    configure: configureWebpack,
  },
  devServer: configureDevServer,
};

module.exports = config;
