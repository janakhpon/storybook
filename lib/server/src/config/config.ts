import { CliOptions, CallOptions, EnvOptions } from '../types/cli';
import {
  Config,
  ConfigCollector,
  PresetFn,
  PresetRef,
  PresetProperties,
  Preset,
  PresetProp,
  ConfigProperties,
  PresetMergeFn,
} from '../types/config';

import * as defaults from './defaults';

import { merge } from '../utils/merge';

export async function getProperties(preset: PresetFn | PresetRef | Preset): Promise<Preset> {
  switch (typeof preset) {
    case 'string': {
      return import(preset);
    }
    case 'function': {
      return preset();
    }
    case 'object': {
      return preset;
    }
    default: {
      console.log(`
        preset should be a string (PresetRef), function (PresetFn), or an object (Preset). 
        The provided value did not match, therefore it was skipped.
      `);
      return {};
    }
  }
}

export function addPropertyToCollector<K extends keyof ConfigCollector>(
  collector: ConfigCollector,
  [key, value]: [K, PresetProperties[K]]
): ConfigCollector {
  if (value && key) {
    const list = [...(collector[key] || []), value];

    return Object.assign({}, collector, { [key]: list });
  }
  return collector;
}

export async function addPresetToCollection(
  collector: ConfigCollector,
  preset: PresetFn | PresetRef | Preset,
  additional?: (PresetFn | PresetRef | Preset)[]
): Promise<ConfigCollector> {
  const { presets, addons, ...m } = await getProperties(preset);

  const c = Object.entries(m).reduce(addPropertyToCollector, collector);

  return []
    .concat(presets || [])
    .concat(addons || [])
    .concat(additional || [])
    .filter(Boolean)
    .reduce(async (pacc: Promise<ConfigCollector>, i: PresetFn | PresetRef | Preset) => {
      const acc = await pacc;

      // RECURSION
      return addPresetToCollection(acc, i);
    }, Promise.resolve(c));
}

export async function apply<K>(list: PresetProp<K>[], config: Config): Promise<K> {
  return list.reduce(async (pacc: Promise<K>, item) => {
    const acc: K = await pacc;

    switch (true) {
      // primitives are simply replaced
      case typeof item === 'undefined':
      case typeof item === 'number':
      case typeof item === 'string': {
        return item;
      }
      // functions get called, with previous value & config
      case typeof item === 'function': {
        const fn = item as PresetMergeFn<K>;
        return fn(acc, config);
      }
      // arrays get concatenated
      case Array.isArray(item) && (Array.isArray(acc) || typeof acc === 'undefined'): {
        const addition = (item as unknown) as string[];
        const base = (acc || []) as string[];
        return base.concat(addition);
      }
      // objects get merged
      case typeof item === 'object': {
        return merge({}, acc, item);
      }
      default: {
        console.log('there was a type mismatch between ');
        return acc;
      }
    }
  }, Promise.resolve(undefined));
}

const createCliPreset = (cliOptions: CliOptions): Preset => {
  // TODO:
  // implement smokeTest, noDll, debugWebpack

  const { port, staticDir, host, sslCa, sslCert, sslKey, https, outputDir, logLevel } = cliOptions;
  return {
    server: ({ static: existingStatic = [], ...base }) =>
      Object.assign(
        {},
        base,
        host ? { host } : {},
        port ? { port } : {},
        staticDir && staticDir.length
          ? { static: existingStatic.concat(staticDir.map(i => ({ '/': i }))) }
          : {},
        https ? { ssl: { ca: sslCa, key: sslKey, cert: sslCert } } : {}
      ),
    output: outputDir ? { location: outputDir } : {},
    logLevel: base => logLevel || base,
  };
};

const createCallPreset = (callOptions: CallOptions): Preset => {
  const { frameworkPresets, overridePresets, middleware } = callOptions;
  return {
    presets: [].concat(frameworkPresets || []).concat(overridePresets),
    server: base => ({
      ...base,
      middleware: [].concat(base.middleware || []).concat(middleware),
    }),
  };
};

export function getConfig({
  configFile,
  cliOptions,
  callOptions,
  envOptions,
}: {
  configFile: PresetRef;
  cliOptions: CliOptions;
  callOptions: CallOptions;
  envOptions: EnvOptions;
}): Config {
  let collector: ConfigCollector;

  const cache: Partial<Config> = {};
  let initialized = false;

  const config: Config = new Proxy(cache, {
    get: async (target, prop: keyof Config) => {
      if (!initialized) {
        collector = {
          entries: [],
          logLevel: [],
          template: [],
          managerTemplate: [],
          webpack: [],
          managerWebpack: [],
          server: [],
          output: [],
        };
        collector = await addPresetToCollection(collector, defaults as Preset);
        collector = await addPresetToCollection(collector, configFile, [
          createCallPreset(callOptions),
          createCliPreset(cliOptions),
        ]);
        initialized = true;
      }

      if (typeof prop !== 'string') {
        return { cache, collector };
      }

      if (!cache[prop]) {
        const list = collector[prop];
        type V = ConfigProperties[typeof prop];

        const output = list ? apply<V>(list, config) : ([] as PresetProp<V>[]);

        cache[prop] = output;
      }

      return cache[prop];
    },
  }) as Config;

  return config;
}
