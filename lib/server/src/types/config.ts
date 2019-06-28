import { LogLevels } from './cli';
import { WebpackConfig } from './webpack';
import { ServerConfig } from './server';

export interface ConfigFile {
  source: string;
  location: string;
}
export interface ConfigFiles {
  node: ConfigFile;
  manager: ConfigFile;
  preview: ConfigFile;
}
export type ConfigTypes = keyof ConfigFiles;

export interface OutputConfig {
  location?: string;
  compress?: boolean;
  preview?: boolean | string;
}

export type Entries = string[];

export interface ConfigProperties {
  entries: Entries;
  logLevel: LogLevels;
  template: string;
  managerTemplate: string;
  webpack: WebpackConfig;
  managerWebpack: WebpackConfig;
  server: ServerConfig;
  output: OutputConfig;
}

export interface Config {
  entries: Promise<Entries>;
  logLevel: Promise<LogLevels>;
  template: Promise<string>;
  managerTemplate: Promise<string>;
  webpack: Promise<WebpackConfig>;
  managerWebpack: Promise<WebpackConfig>;
  server: Promise<ServerConfig>;
  output: Promise<OutputConfig>;
}
export interface ConfigCollector {
  entries: (PresetProperties['entries'])[];
  logLevel: (PresetProperties['logLevel'])[];
  template: (PresetProperties['template'])[];
  managerTemplate: (PresetProperties['managerTemplate'])[];
  webpack: (PresetProperties['webpack'])[];
  managerWebpack: (PresetProperties['managerWebpack'])[];
  server: (PresetProperties['server'])[];
  output: (PresetProperties['output'])[];
}

export type PresetMergeFn<T> = (base: T, config: Config) => T;
export type PresetMergeAsyncFn<T> = (base: T, config: Config) => Promise<T>;
export type PresetProp<T> = T | PresetMergeFn<T> | PresetMergeAsyncFn<T>;
export interface PresetProperties {
  entries: PresetProp<Entries>;
  logLevel: PresetProp<LogLevels>;
  template: PresetProp<string>;
  managerTemplate: PresetProp<string>;
  webpack: PresetProp<WebpackConfig>;
  managerWebpack: PresetProp<WebpackConfig>;
  server: PresetProp<ServerConfig>;
  output: PresetProp<OutputConfig>;
}
export interface PresetAdditives {
  presets: PresetRef[];
  addons: string[];
}
export type PresetRef = string;
export type PresetFn = () => Promise<Preset>;
export type Preset = Partial<PresetProperties & PresetAdditives>;
