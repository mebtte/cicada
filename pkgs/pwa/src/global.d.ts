/* eslint-disable no-underscore-dangle */
import '@types/resize-observer-browser';

export {};

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

  type ValueOf<T> = T[keyof T];

  type AsyncReturnType<T extends (...args: any) => any> = T extends (
    ...args: any
  ) => Promise<infer U>
    ? U
    : T extends (...args: any) => infer U
    ? U
    : any;

  type PromiseType<T> = T extends PromiseLike<infer U> ? U : T;

  interface Window {
    requestIdleCallback: (
      callback: (deadline: {
        didTimeout: boolean;
        timeRemaining: () => number;
      }) => void,
      opts?: {
        timeout: number;
      },
    ) => number;
    cancelIdleCallback: (id: number) => void;
  }
}
