import { EnvOptions } from '../types/cli';

export function cleanEnvOptions(envOptionsRaw: { [key: string]: string }): EnvOptions {
  const { NODE_ENV, SB_PORT } = envOptionsRaw;
  return {
    NODE_ENV: (NODE_ENV as EnvOptions['NODE_ENV']) || ('development' as EnvOptions['NODE_ENV']),
    SB_PORT: parseInt(SB_PORT, 10),
  };
}
