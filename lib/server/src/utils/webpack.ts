import webpack from 'webpack';
import webpackMerge from 'webpack-merge';
import { WebpackPluginServe } from 'webpack-plugin-serve';
import WebpackBar, { Reporter } from 'webpackbar';
import killPort from 'kill-port';
import globToRegexp from 'glob-to-regexp';

import { create } from './entrypointsPlugin';

import { Preset } from '../types/config';

const ensureEntryIsObject = async (
  entry:
    | string
    | string[]
    | webpack.Entry
    | Promise<string | string[] | webpack.Entry>
    | webpack.EntryFunc
): Promise<webpack.Entry> => {
  const r = await entry;

  if (typeof r === 'function') {
    return ensureEntryIsObject(r());
  }
  if (typeof r === 'string') {
    return { main: [r] };
  }
  if (Array.isArray(r)) {
    return { main: r };
  }
  return r;
};

const storybookEntryPreset: Preset = {
  managerWebpack: async (base, config) => {
    const { plugin, entries } = create(await config.entries, {});

    const rule = {
      use: require.resolve('../manager/webpack-loader'),
      test: (await config.entries).map(i => globToRegexp(i)),
    };

    const entry = await entries();

    return webpackMerge(base, {
      entry,
      module: {
        rules: [rule],
      },
      plugins: [plugin],
    });
  },
};

const webpackServePreset: Preset = {
  managerWebpack: async (base, config) => {
    const { host, devPorts } = await config.server;
    const port = devPorts.manager;

    await killPort(port, 'tcp');

    return webpackMerge(base, {
      entry: {
        hmr: ['webpack-plugin-serve/client'],
      },
      plugins: [
        new WebpackPluginServe({
          static: base.output.path,
          client: {
            address: `${host}:${port}`,
            silent: true,
          },
          // TODO:
          // this injects quite a bit UI I don't like, would love to build something custom based on this
          // https://github.com/shellscape/webpack-plugin-serve/blob/master/lib/client/client.js
          status: true,
          progress: true,
          host,
          port,
          // open: true,
          log: { level: 'error', timestamp: false },
          hmr: true,
          compress: true,
        }),
      ],
    });
  },
};

const createWebpackReporterPreset = (reporter: Reporter): Preset => ({
  managerWebpack: base => {
    return webpackMerge(base, {
      plugins: [
        new WebpackBar({
          name: 'manager',
          color: 'hotpink',
          profile: false,
          fancy: false,
          basic: false,
          reporter,
          reporters: [],
        }),
      ],
    });
  },
});

export {
  ensureEntryIsObject,
  webpackServePreset,
  storybookEntryPreset,
  createWebpackReporterPreset,
};
