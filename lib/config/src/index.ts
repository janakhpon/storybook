import path from 'path';
import fs from 'fs-extra';
import findCacheDir from 'find-cache-dir';

import pkgDir from 'pkg-dir';
import gitDir from 'git-root-dir';

import { preshake } from './preshake';
import { treeshake } from './treeshake';

const getConfigFileName = (base: string) => `${base}.config.js`;
interface Indentifyable {
  id: string;
}

interface Data {
  location: string;
  source: string;
}

type Item = Indentifyable & Data;
type List = Item[];
type FileName = string;

interface Config {
  [id: string]: string[];
}
interface Input {
  file: FileName;
  config: Config;
  cacheDir: string | undefined | null;
}

interface Result {
  [id: string]: Data;
}

export const getConfigPath = async (fileName: FileName): Promise<string> => {
  const locations = [
    async () => process.cwd(), // user's current working directory
    async () => '.', //
    pkgDir, // look up to where package.json is, and use that directory
    gitDir, // look up to where .git is and use that directory
  ];

  const fullPath = await locations.reduce(
    async (acc: Promise<string>, l: () => Promise<string>): Promise<string> => {
      const prevResult = await acc;
      if (prevResult) {
        return prevResult;
      }
      const location = await l();
      const p = path.join(location, fileName);
      const result = (await fs.pathExists(p)) ? p : prevResult;
      return result;
    },
    Promise.resolve('')
  );

  // if empty string, return undefined
  return fullPath || undefined;
};

export const getCacheDir = () => findCacheDir({ name: 'storybook' });

export const getCoreDir = () =>
  path.join(path.dirname(require.resolve('@storybook/core/package.json')), 'dist');

export const getStorybookConfigPath = async () => {
  const configFileName: FileName = 'storybook.config.js';
  return getConfigPath(configFileName);
};

export const splitter = async ({ file, config, cacheDir = './' }: Input): Promise<Result> => {
  const raw = await fs.readFile(file, 'utf8');

  const list: List = Object.entries(config).map(([k, v]) => {
    return {
      id: k,
      location: cacheDir ? path.join(cacheDir, getConfigFileName(k)) : getConfigFileName(k),
      source: preshake(raw, v),
    };
  });

  const result: List = await Promise.all(
    list.map(({ id, location, source }) =>
      treeshake(location, source, cacheDir).then(chunks => {
        return {
          id,
          location,
          source: chunks.find(c => c.fileName === getConfigFileName(id)).code,
        };
      })
    )
  );

  return result.reduce((acc, { id, ...rest }) => {
    return { ...acc, [id]: rest };
  }, {});
};

export const getStorybookConfigs = async () => {
  const file = await getStorybookConfigPath();

  if (file) {
    const cacheDir = getCacheDir();

    const config = {
      manager: ['theme', 'managerInit'],
      preview: ['previewInit'],
      node: [
        'presets',
        'server',
        'addons',
        'entries',
        'webpack',
        'babel',
        'managerWebpack',
        'managerBabel',
      ],
    };

    return splitter({ file, config, cacheDir });
  }
  return undefined;
};
