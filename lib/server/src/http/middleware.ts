import favicon from 'serve-favicon';
import path from 'path';
import express from 'express';
import fs from 'fs-extra';

import { progress, logger } from '@storybook/node-logger';

import { Express, StaticConfig, Middleware } from '../types/server';
import { CliOptions, CallOptions } from '../types/cli';
import { ConfigProperties } from '../types/config';

const faviconLocation = (location: string) => path.resolve(location, 'favicon.ico');
const containsFavicon = async (location: string) => fs.pathExists(faviconLocation(location));
const defaultFaviconLocation = faviconLocation(path.join(__dirname, '..', 'assets'));

const staticMiddleware = (config: StaticConfig[]) => async (app: Express) => {
  const list = config.reduce((acc, i) => {
    return acc.concat(Object.entries(i));
  }, []);

  const hasCustomFavicon = await list.reduce(async (acc, [route, location]) => {
    const fullLocation = path.resolve(location);

    if (await !fs.pathExists(fullLocation)) {
      logger.error(`Error: no such directory to load static files: "${fullLocation}"`);
    } else {
      // TODO should be part of server
      progress.emit('server', {
        message: `adding static files from: "${location}", routing at "${route}"`,
        details: [location, route],
      });
    }

    app.use(express.static(fullLocation, { index: false }));

    // if route is root and we haven't found a favicon before and this one contains a favicon
    if (route === '/' && !(await acc) && (await containsFavicon(fullLocation))) {
      app.use(favicon(faviconLocation(fullLocation)));
      return true;
    }
    return acc;
  }, Promise.resolve(false));

  if (!hasCustomFavicon) {
    app.use(favicon(defaultFaviconLocation));
  }
};

const createStaticPathsConfig = (
  fromCli: string[] = [],
  fromConfig: StaticConfig[] = []
): StaticConfig[] => [...fromConfig, fromCli.reduce((acc, p) => ({ ...acc, '/': p }), {})];

// middleware has access to the app & server, and can add http handlers and routes
const createMiddleware = async (
  fromCli: CliOptions,
  fromConfig: ConfigProperties,
  addition: CallOptions
): Promise<Middleware[]> => {
  const staticContentConfig = createStaticPathsConfig(
    [].concat(fromCli.staticDir || []),
    fromConfig.server.static
  );

  return []
    .concat(await staticMiddleware(staticContentConfig))
    .concat(fromConfig.server.middleware || [])
    .concat(addition.middleware || []);
};

export { createMiddleware };
