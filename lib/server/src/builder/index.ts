import fs from 'fs';
import { promisify } from 'util';
import { fork, ChildProcess } from 'child_process';
import path from 'path';

import EventEmitter from 'eventemitter3';
import { stripIndent } from 'common-tags';

import { getCacheDir } from '@storybook/config';

import { CreateParams, RunParams, Runner, Event } from '../types/runner';

const cacheDir = getCacheDir();

const appendFile = promisify(fs.appendFile);

const createLog = async (sub: ChildProcess, { command, type }: CreateParams) => {
  const logFile = path.join(cacheDir, `./${type}-${command}.log`);

  await appendFile(
    logFile,
    `\n${stripIndent`
    **
    ** Log of ${command} of ${type} at ${new Date().toISOString()}
    **
    `}\n\n`
  );

  const log = fs.createWriteStream(logFile, { flags: 'a' });

  sub.stdout.pipe(log);
  sub.stderr.pipe(log);
};

const create = function create(createParams: CreateParams, runParams: RunParams): Runner {
  let process: ChildProcess;
  const runner = new EventEmitter();
  const { command, type } = createParams;

  return {
    start: async () => {
      process = fork(path.join(__dirname, 'commands', command), [], {
        silent: true,
      });

      await createLog(process, createParams);

      process.on('message', (event: Event) => {
        runner.emit(event.type, event.data);
      });

      const result = process.send({
        command: 'init',
        options: runParams,
        type,
      });

      if (!result) {
        throw new Error(`could not start ${command} for ${type}`);
      }
    },
    stop: async () =>
      new Promise((resolve, reject) => {
        if (process) {
          process.kill();

          process.on('exit', exitCode => {
            if (exitCode === 0) {
              resolve();
            } else {
              reject(new Error('non 0 error code'));
            }
          });
        } else {
          reject(new Error('process not running'));
        }
      }),
    listen: (...args) => runner.on(...args),
  };
};

const fake = function fake(): Runner {
  const runner = new EventEmitter();
  let count = 0;
  const interval = setInterval(() => {
    count += 1;
    runner.emit('progress', {
      message: `progress is being made [${count}/100]`,
      progress: count,
      status: 'progress',
    });

    if (count === 100) {
      clearInterval(interval);
      runner.emit('success', {
        message: 'completed all the work',
      });
    }
  }, 50);

  return {
    start: async () => {},
    stop: async () => {},
    listen: (...args) => runner.on(...args),
  };
};

export { create, fake };
