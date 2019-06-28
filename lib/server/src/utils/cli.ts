import pick from 'lodash/pick';
import { CliOptions } from '../types/cli';

export const cleanCliOptions = (options: CliOptions): CliOptions => {
  return pick(options, [
    'ci',
    'configDir',
    'debugWebpack',
    'host',
    'https',
    'logLevel',
    'noDll',
    'outputDir',
    'port',
    'quiet',
    'smokeTest',
    'sslCa',
    'sslCert',
    'sslKey',
    'staticDir',
  ]);
};
