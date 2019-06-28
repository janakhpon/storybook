// import path from 'path';
// import webpack from 'webpack';

// import HtmlWebpackPlugin from 'html-webpack-plugin';
// import CaseSensitivePathsPlugin from 'case-sensitive-paths-webpack-plugin';
// import { getCacheDir } from '@storybook/config';

// import { EnvironmentType, OutputConfig, BuildConfig } from '../types';

// const cacheDir = getCacheDir();

// const createEntrypoints = async (
//   env: EnvironmentType,
//   entries: BuildConfig['entries']
// ): Promise<webpack.Configuration['entry']> => {
//   const coreDistFolder = path.join(
//     path.dirname(require.resolve('@storybook/core/package.json')),
//     'dist'
//   );
//   return {
//     main: [
//       `${coreDistFolder}/server/common/polyfills.js`,
//       `${coreDistFolder}/client/manager/index.js`,
//     ],
//   };
// };

// const createBaseWebpackConfig = async (
//   env: EnvironmentType,
//   output: OutputConfig,
//   entries: BuildConfig['entries']
// ): Promise<webpack.Configuration> => {
//   return {
//     name: 'manager',
//     mode: env,
//     bail: env === 'production',
//     devtool: false,

//     entry: await createEntrypoints(env, entries),
//     output: {
//       path: output.location,
//       filename: '[name].[hash].bundle.js',
//       publicPath: '',
//     },

//     plugins: [
//       new HtmlWebpackPlugin({
//         filename: `index.html`,
//         chunksSortMode: 'none',
//         alwaysWriteToDisk: true,
//         inject: false,
//         templateParameters: (compilation, files, templateOptions) => ({
//           compilation,
//           files,
//           options: templateOptions,
//           version: 1,
//           dlls: [],
//           headHtmlSnippet: '',
//         }),
//         template: path.join(__dirname, '..', 'templates', 'index.ejs'),
//       }),
//       new CaseSensitivePathsPlugin(),
//     ],

//     resolve: {
//       extensions: ['.mjs', '.js', '.jsx', '.json'],
//       modules: ['node_modules'],
//     },
//     recordsPath: path.join(cacheDir, 'records.json'),
//     optimization: {
//       splitChunks: {
//         chunks: 'all',
//       },
//       runtimeChunk: true,
//     },
//   };
// };

// export { createBaseWebpackConfig };
