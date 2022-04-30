/* eslint-disable no-underscore-dangle */
import '@types/resize-observer-browser';

interface Config {
  version: string;
  buildTime: string;
  emptyImageList: string[];
  errorImageList: string[];
  coverList: string[];

  serverOrigin: string;
  pwaOrigin: string;

  sentryDSN?: string;
}

declare global {
  const __CONFIG__: Config;
}
