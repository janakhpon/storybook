import https from 'https';
import http from 'http';
import fs from 'fs-extra';
import express from 'express';
import EventEmitter from 'eventemitter3';
import proxy from 'express-http-proxy';

import { logger } from '@storybook/node-logger';

import { getConfig } from '../config/config';

import { Express, ServerConfig, Server } from '../types/server';
import { Runner, RunParams } from '../types/runner';

const serverFactory = async (options: ServerConfig) => {
  const { ssl, port } = options;
  if (ssl) {
    if (!ssl.cert) {
      logger.error('Error: --ssl-cert is required with --https');
      process.exit(-1);
    }

    if (!ssl.key) {
      logger.error('Error: --ssl-key is required with --https');
      process.exit(-1);
    }

    const sslOptions = {
      ca: await Promise.all((ssl.ca || []).map(ca => fs.readFile(ca, 'utf-8'))),
      cert: await fs.readFile(ssl.cert, 'utf-8'),
      key: await fs.readFile(ssl.key, 'utf-8'),
    };

    return (app: Express) => https.createServer(sslOptions, app);
  }
  return (app: Express) => http.createServer(app);
};

const createServer = async (options: ServerConfig, app: Express) => {
  const create = await serverFactory(options);
  return create(app);
};

const createApp = async () => express();

const listen = async (server: http.Server | https.Server, options: ServerConfig) => {
  return new Promise((res, rej) => {
    server.listen({ port: options.port, host: options.host }, (error?: Error) => {
      if (error) {
        rej(error);
      }
      res();
    });
  });
};

const addProxyHandler = (app: Express, { host, port }: { host: string; port: number }) => {
  app.use(
    '/',
    proxy(`http://${host}:${port}`, {
      skipToNextHandlerFilter: ({ statusCode }) => statusCode === 404,
    })
  );
};

const addMiddlewareHandlers = async (
  app: Express,
  server: Server,
  { middleware }: { middleware: ServerConfig['middleware'] }
) => {
  return Promise.all(
    [].concat(middleware).map(async item => {
      if (typeof item === 'function') {
        return item(app, server);
      }
    })
  );
};

const add404Handler = (app: Express) => {
  app.use('/', (req, res) => {
    res.status(404);

    // respond with html page
    if (req.accepts('html')) {
      res.send('Not found');
      return;
    }

    // respond with json
    if (req.accepts('json')) {
      res.send({ error: 'Not found' });
      return;
    }

    // default to plain-text. send()
    res.type('txt').send('Not found');
  });
};

export const create = function create({
  configFiles,
  cliOptions,
  callOptions,
  envOptions,
}: RunParams): Runner {
  const runner = new EventEmitter();
  let server: http.Server | https.Server;

  return {
    start: async () => {
      try {
        runner.emit('progress', { message: 'loading config', progress: 1 });

        console.log('here');

        const config = getConfig({
          configFile: configFiles.node.location,
          cliOptions,
          callOptions,
          envOptions,
        });

        const serverConfig = await config.server;

        runner.emit('progress', { message: 'creating express app', progress: 80 });
        const app = await createApp();
        server = await createServer(serverConfig, app);

        addProxyHandler(app, { host: serverConfig.host, port: serverConfig.devPorts.manager });
        addProxyHandler(app, { host: serverConfig.host, port: serverConfig.devPorts.preview });
        add404Handler(app);

        await addMiddlewareHandlers(app, server, { middleware: serverConfig.middleware });

        await listen(server, serverConfig);

        runner.emit('success', {
          message: `server running : ${serverConfig.port}`,
          details: [`${serverConfig.host}:${serverConfig.port}`],
        });
      } catch (e) {
        runner.emit('failure', { message: e.message, detail: [e] });
        throw e;
      }
    },
    stop: async () => {
      return Promise.race([
        new Promise<void>((res, rej) => {
          if (server && server.listening) {
            server.close(() => {
              res();
            });
          } else {
            rej(new Error('server not listening'));
          }
        }),
        new Promise<void>((res, rej) => {
          setTimeout(() => rej(new Error('timout closing server')), 1000);
        }),
      ]);
    },
    listen: (...args) => runner.on(...args),
  };
};
