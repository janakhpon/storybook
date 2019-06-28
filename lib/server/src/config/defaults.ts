import path from 'path';
import { getCacheDir, getCoreDir } from '@storybook/config';
import { Entries, OutputConfig } from '../types/config';
import { WebpackConfigMerger, WebpackConfig } from '../types/webpack';
import { ServerConfig } from '../types/server';

const cacheDir = getCacheDir();
const coreDir = getCoreDir();

export const logLevel = 'info';

export const entries: Entries = [];

export const output: OutputConfig = {
  compress: false,
  location: path.join(cacheDir, 'out'),
  preview: true,
};

export const managerWebpack: WebpackConfigMerger = async (_, config): Promise<WebpackConfig> => {
  const { default: HtmlWebpackPlugin } = await import('html-webpack-plugin');
  const { default: CaseSensitivePathsPlugin } = await import('case-sensitive-paths-webpack-plugin');

  const { location } = await config.output;

  return {
    name: 'manager',
    mode: 'development',
    bail: true,
    devtool: false,

    entry: {
      main: [`${coreDir}/server/common/polyfills.js`, `${coreDir}/client/manager/index.js`],
    },
    output: {
      path: location,
      filename: '[name].[hash].bundle.js',
      publicPath: '',
    },

    plugins: [
      new HtmlWebpackPlugin({
        filename: `index.html`,
        chunksSortMode: 'none',
        alwaysWriteToDisk: true,
        inject: false,
        templateParameters: (compilation, files, templateOptions) => ({
          compilation,
          files,
          options: templateOptions,
          version: 1,
          dlls: [],
          headHtmlSnippet: '',
        }),
        template: path.join(__dirname, '..', 'templates', 'index.ejs'),
      }),
      new CaseSensitivePathsPlugin(),
    ],

    resolve: {
      extensions: ['.mjs', '.js', '.jsx', '.json'],
      modules: ['node_modules'],
    },
    recordsPath: path.join(cacheDir, 'records.json'),
    optimization: {
      splitChunks: {
        chunks: 'all',
      },
      runtimeChunk: true,
    },
  };
};

export const server: ServerConfig = {
  port: 5000,
  devPorts: {
    manager: 55550,
    preview: 55551,
  },
  host: 'localhost',
  middleware: [],
  static: [],
};
