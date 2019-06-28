import { State } from 'webpackbar';
import EventEmitter from 'eventemitter3';

import { ConfigPrefix, EnvironmentType, CliOptions, CallOptions, EnvOptions } from './cli';
import { ConfigFiles } from './config';

export type Status = 'progress' | 'success' | 'failure';

export interface ProgressDescription {
  message: string;
  progress?: number;
  detail?: string[];
  status: Status;
}

export interface State {
  [name: string]: ProgressDescription;
}

export interface RunParams {
  envOptions: EnvOptions;
  cliOptions: CliOptions;
  configFiles: ConfigFiles;
  callOptions: CallOptions;
}

export interface CreateParams {
  command: string;
  type: ConfigPrefix;
}

export interface ProgressEvent {
  type: 'progress';
  data: State;
}
export interface SuccessEvent {
  type: 'success';
  data: any;
}
export interface FailureEvent {
  type: 'failure';
  err: Error;
  data: any;
}

export type Event = ProgressEvent | SuccessEvent | FailureEvent;

export interface Runner {
  start: () => Promise<void>;
  stop: () => Promise<void>;
  listen: EventEmitter['on'];
}
