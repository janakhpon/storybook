import { PresetRef, ConfigFiles } from './config';
import { Middleware } from './server';

export interface CliOptions {
  port: number;
  host: string;
  staticDir: string[];
  configDir: string;
  outputDir: string;
  https: boolean;
  sslCa: string;
  sslCert: string;
  sslKey: string;
  smokeTest: boolean;
  ci: boolean;
  quiet: boolean;
  logLevel: LogLevels;
  noDll: boolean;
  debugWebpack: boolean;
}

export interface CallOptions {
  frameworkPresets: PresetRef[];
  overridePresets: PresetRef[];
  middleware?: Middleware | Middleware[];
}

export interface StartOptions {
  cliOptions: CliOptions;
  callOptions: CallOptions;
  configFiles: ConfigFiles;
}

export interface EnvOptions {
  NODE_ENV: 'development' | 'production';
  SB_PORT: number;
}

export type EnvironmentType = 'production' | 'development';
export type LogLevels = 'silly' | 'verbose' | 'info' | 'warn' | 'error' | 'silent';
export type ConfigPrefix = 'manager' | 'preview';
