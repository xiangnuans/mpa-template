const path = require("path");
// const WebpackBar = require("webpackbar");
const fs = require("fs");
const lessToJs = require("less-vars-to-js");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const InlineChunkHtmlPlugin = require("react-dev-utils/InlineChunkHtmlPlugin");

const readFile = (filename) => {
  if (!fs.existsSync(filename)) return false;
  return fs.readFileSync(filename, "utf8");
};

const configureWebpack = (webpackConfig, { env, paths }) => {
  const isEnvDevelopment = env === "development";
  const isEnvProduction = env === "production";
  const mHtmlWebpackPlugin = (chunks, filename, template) => {
    return new HtmlWebpackPlugin({
      inject: true,
      template: template || paths.appHtml,
      chunks,
      filename,
      ...(isEnvProduction
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
    ...entries,
  };
  webpackConfig.output = {
    path: isEnvProduction ? paths.appBuild : undefined,
    pathinfo: isEnvDevelopment,
    filename: isEnvProduction
      ? "static/js/[name].[contenthash:8].js"
      : "static/[name]/bundle.js",
    futureEmitAssets: true,
    chunkFilename: isEnvProduction
      ? "static/js/[name].[contenthash:8].chunk.js"
      : "static/js/[name].chunk.js",
    publicPath: isEnvProduction ? paths.servedPath : "/",
    devtoolModuleFilenameTemplate: isEnvProduction
      ? (info) =>
          path
            .relative(paths.appSrc, info.absoluteResourcePath)
            .replace(/\\/g, "/")
      : (info) => path.resolve(info.absoluteResourcePath).replace(/\\/g, "/"),
    jsonpFunction: `webpackJsonp${paths.appPackageJson.name}`,
  };
  webpackConfig.resolve.alias = {
    src: path.resolve(__dirname, "./src"),
    "@assets": "src/assets",
    "@components": "src/components",
    "@hooks": "src/hooks",
    "@containers": "src/containers",
    "@routes": "src/routes",
    "@stores": "src/stores",
    "@utils": "src/utils",
    "@styles": "src/styles",
  };
  const oneOfRule = webpackConfig.module.rules.find((rule) => rule.oneOf);
  const sassRuleIndex = oneOfRule.oneOf.findIndex(
    (rule) => rule.test && rule.test.toString().includes("scss|sass")
  );
  const lessUse = [...oneOfRule.oneOf[sassRuleIndex].use];
  lessUse[lessUse.length - 1] = {
    loader: require.resolve("less-loader"),
    options: {
      lessOptions: {
        sourceMap: isEnvDevelopment,
        modifyVars: lessToJs(
          readFile(path.resolve(__dirname, "src/styles/themes/index.less"))
        ),
        javascriptEnabled: true,
      },
    },
  };
  oneOfRule.oneOf.splice(sassRuleIndex, 0, {
    exclude: /\.module\.(less)$/,
    test: /\.less$/,
    use: lessUse,
  });
  webpackConfig.externals = [
    require("webpack-require-http"),
    {
      axios: "axios",
      react: "React",
      "react-dom": "ReactDOM",
      bizcharts: "BizCharts",
    },
  ];

  const defaultHtmlWebpackPluginIndex = webpackConfig.plugins.findIndex(
    (plugin) => plugin instanceof HtmlWebpackPlugin
  );
  webpackConfig.plugins.splice(
    defaultHtmlWebpackPluginIndex,
    1,
    mHtmlWebpackPlugin(["main"], "index.html"),
    ...htmlWebpackPlugins
  );

  if (isEnvDevelopment) {
    webpackConfig.output.filename = "static/js/[name].bundle.js";
  }
  //共用runtime bundle
  webpackConfig.optimization.runtimeChunk = "single";
  const inlineChunkHtmlPluginIndex = webpackConfig.plugins.findIndex(
    (plugin) => plugin instanceof InlineChunkHtmlPlugin
  );
  if (inlineChunkHtmlPluginIndex >= 0) {
    webpackConfig.plugins.slice(inlineChunkHtmlPluginIndex, 1);
  }

  // console.log("webpackConfig = ", webpackConfig);
  return webpackConfig;
};

const configureDevServer = (devServerConfig, { env, paths }) => {
  devServerConfig.historyApiFallback = {
    disableDotRule: true, //禁用，否则当访问/xxx.html时服务器会自动去掉.html重写url为/xxx
    index: paths.publicUrlOrPath,
    verbose: true,
  };
  if (env === "development") {
    devServerConfig.proxy = {
      "/auth": {
        target: "https://xxx.cn",
        changeOrigin: true,
      },
    };
  }
  return devServerConfig;
};
module.exports = {
  webpack: {
    configure: configureWebpack,
  },
  devServer: configureDevServer,
};
