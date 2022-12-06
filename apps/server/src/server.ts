import http from 'http';
import Koa from 'koa';
import log from 'koa-logger';
import cors from '@koa/cors';
import mount from 'koa-mount';
import { PathPrefix } from '#/constants';
import initialize from './initialize';
import apiApp from './api_app';
import blobApp from './blob_app';
import assetApp from './asset_app';
import pwaApp from './pwa_app';
import schedule from './schedule';
import env from './env';
import downloadApp from './download_app';
import config, { Config } from './config';
import requirementCheck from './requirement_check';

function printInfo(info: string) {
  // eslint-disable-next-line no-console
  console.log(`--- ${info} ---`);
}

async function start(c: Partial<Config>) {
  config.set(c);

  await initialize();

  requirementCheck();

  for (const key of Object.keys(env)) {
    printInfo(`env | ${key} = ${env[key]}`);
  }

  const newConfig = config.get();
  const SECRET_CONFIG_KEYS: (keyof Config)[] = ['emailPass'];
  for (const key of Object.keys(newConfig) as (keyof Config)[]) {
    printInfo(
      `config | ${key} = ${
        SECRET_CONFIG_KEYS.includes(key)
          ? '*'.repeat(String(newConfig[key]).length)
          : newConfig[key]
      }`,
    );
  }

  schedule.start();

  const server = new Koa();
  if (env.RUN_ENV === 'development') {
    server.use(log());
  }
  server.use(
    cors({
      maxAge: 86400,

      /**
       * 当 navigator.sendBeacon 格式是 json 时必须
       * @author mebtte<hi@mebtte.com>
       */
      credentials: true,
    }),
  );
  server.use(mount(`/${PathPrefix.ASSET}`, assetApp));
  server.use(mount(`/${PathPrefix.DOWNLOAD}`, downloadApp));
  server.use(mount(`/${PathPrefix.API}`, apiApp));
  server.use(mount(`/${PathPrefix.BLOB}`, blobApp));
  server.use(mount('/', pwaApp));
  http.createServer(server.callback()).listen(newConfig.port);
}

export default {
  start,
};
