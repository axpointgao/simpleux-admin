/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const {
  override,
  addWebpackModuleRule,
  addWebpackPlugin,
  addWebpackAlias,
} = require('customize-cra');
const ArcoWebpackPlugin = require('@arco-plugins/webpack-react');
const addLessLoader = require('customize-cra-less-loader');
const setting = require('./src/settings.json');

module.exports = {
  webpack: override(
    addLessLoader({
      lessLoaderOptions: {
        lessOptions: {},
      },
    }),
    addWebpackModuleRule({
      test: /\.svg$/,
      loader: '@svgr/webpack',
    }),
    addWebpackPlugin(
      new ArcoWebpackPlugin({
        theme: '@arco-themes/react-arco-pro',
        modifyVars: {
          'arcoblue-6': setting.themeColor,
        },
      })
    ),
    addWebpackAlias({
      '@': path.resolve(__dirname, 'src'),
    }),
    // 强制所有包使用同一个 React 实例，解决 bizcharts 的多个 React 副本问题
    (config) => {
      // 确保 node_modules 从项目根目录解析，避免嵌套依赖
      config.resolve.modules = [
        path.resolve(__dirname, 'node_modules'),
        'node_modules',
      ];

      // 禁用符号链接，确保使用真实的 node_modules
      config.resolve.symlinks = false;

      // 排除 bizcharts 嵌套依赖，避免 source-map-loader 处理
      if (config.module && config.module.rules) {
        config.module.rules = config.module.rules.map((rule) => {
          if (rule.use && Array.isArray(rule.use)) {
            const hasSourceMapLoader = rule.use.some(
              (use) => use.loader && use.loader.includes('source-map-loader')
            );
            if (hasSourceMapLoader) {
              const exclude = Array.isArray(rule.exclude)
                ? rule.exclude
                : rule.exclude
                ? [rule.exclude]
                : [];
              exclude.push(/node_modules\/bizcharts\/node_modules/);
              return { ...rule, exclude };
            }
          }
          return rule;
        });
      }

      return config;
    }
  ),
};
