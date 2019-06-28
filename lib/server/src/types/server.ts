import { Express } from 'express';
import https from 'https';
import http from 'http';

export type Middleware = (app: Express, server?: Server) => Promise<void>;
export type Server = http.Server | https.Server;

export interface ServerConfig {
  port: number;
  host: string;
  devPorts: {
    manager: number;
    preview: number;
  };
  ssl?: {
    ca: string[];
    cert: string;
    key: string;
  };
  middleware?: Middleware | Middleware[];
  static?: StaticConfig[];
}

export interface StaticConfig {
  [route: string]: string;
}

export { Express };
