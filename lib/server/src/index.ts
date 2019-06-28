import setTitle from 'node-bash-title';

import { logger } from '@storybook/node-logger';

import { cleanCliOptions } from './utils/cli';
import { cleanEnvOptions } from './utils/env';

import * as terminalApp from './terminal-app/app';
import * as builder from './builder/index';
import * as http from './http/http';

import { StartOptions } from './types/cli';

// main function
const start = async ({ configFiles, callOptions, cliOptions: cliOptionsRaw }: StartOptions) => {
  logger.warn('experimental mono config mode enabled');

  setTitle('storybook');

  // filter the env options
  const envOptions = cleanEnvOptions(process.env);

  // filter the cli options
  const cliOptions = cleanCliOptions(cliOptionsRaw);

  const manager = builder.create(
    {
      command: 'watch',
      type: 'manager',
    },
    {
      envOptions,
      cliOptions,
      configFiles,
      callOptions,
    }
  );
  const preview = builder.fake();

  const server = http.create({ configFiles, cliOptions, callOptions, envOptions });

  terminalApp.run({
    server,
    manager,
    preview,
  });
};

export { start };
