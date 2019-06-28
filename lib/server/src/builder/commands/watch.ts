import setTitle from 'node-bash-title';
import webpack from 'webpack';

import { reportError, reportStats, reportProgress, reportSuccess } from '../../utils/ipc';

import { RunParams } from '../../types/runner';
import { WebpackConfig } from '../../types/webpack';
import { Config } from '../../types/config';
import { ConfigPrefix } from '../../types/cli';

import { getConfig } from '../../config/config';

const getWebpackConfig = async (type: ConfigPrefix, config: Config) => {
  switch (type) {
    case 'manager': {
      return config.managerWebpack;
    }
    case 'preview': {
      return config.webpack;
    }
    default: {
      throw new Error('not supported type, specify "manager" or "preview"');
    }
  }
};

let watcher: webpack.Watching;

const watcherOptions: webpack.ICompiler.WatchOptions = {
  aggregateTimeout: 10,
};

const watcherHandler: webpack.ICompiler.Handler = (err, stats) => {
  // Stats Object
  // Print watch/build result here...
  if (err) {
    reportStats(stats);
    reportError(err);
    return;
  }
  if (stats) {
    reportStats(stats);
    reportSuccess({ message: 'successful compilation' });
  }
};

const watch = async (webpackConfig: WebpackConfig): Promise<webpack.Watching | null> => {
  console.dir({ webpackConfig }, { depth: 20 });
  try {
    return webpack(webpackConfig).watch(watcherOptions, watcherHandler);
  } catch (e) {
    reportError(e);
    throw e;
  }
};

const commands = {
  init: async (
    type: ConfigPrefix,
    { configFiles, cliOptions, callOptions, envOptions }: RunParams
  ) => {
    reportProgress({ message: 'loading config', progress: 1 });
    const config = getConfig({
      configFile: configFiles.node.location,
      cliOptions,
      callOptions,
      envOptions,
    });

    const webpackConfig = await getWebpackConfig(type, config);

    // TODO: add watcher plugin stuff

    watcher = await watch(webpackConfig);
    return watcher;
  },
  stop: async () => {
    return new Promise((res, rej) => {
      if (watcher) {
        watcher.close(() => res());
      } else {
        rej(new Error('watcher not active'));
      }
    });
  },
};

interface CommandInitiator {
  command: keyof typeof commands;
  options: RunParams;
  type: ConfigPrefix;
}

process.on('message', async ({ command, options, type }: CommandInitiator) => {
  try {
    await commands[command](type, options);
    reportSuccess({ message: 'command completed' });
  } catch (e) {
    reportError(e);
  }
  setTitle(`storybook ${type} ${command}`);
});
