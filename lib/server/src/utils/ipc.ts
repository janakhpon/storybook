import { State } from 'webpackbar';
import webpack from 'webpack';

const statOptions = {
  all: false,
  modules: true,
  maxModules: 0,
  errors: true,
  warnings: true,
  moduleTrace: true,
  errorDetails: true,
  context: process.cwd(),
};

export const reportProgress = (data: Partial<State>) => {
  process.send({ type: 'progress', data });
};
export const reportSuccess = (data: { message: string; detail?: any[] }) => {
  process.send({ type: 'success', data });
};
export const reportStats = (stats: webpack.Stats) => {
  process.send({ type: 'stats', data: stats.toJson(statOptions) });
};
export const reportError = (err: Error) => {
  process.send({
    type: 'failure',
    data: { message: err.message, detail: [err] },
  });
};
