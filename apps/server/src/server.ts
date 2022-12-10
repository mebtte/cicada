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
import downloadApp from './download_app';
import { updateConfigFromFile, getConfig, Config } from './config';
import requirementCheck from './requirement_check';

function printInfo(info: string) {
  // eslint-disable-next-line no-console
  console.log(`--- ${info} ---`);
}

async function start(configFilePath: string) {
  updateConfigFromFile(configFilePath);
  const config = getConfig();

  await initialize();
  requirementCheck();

  const SECRET_CONFIG_KEYS: (keyof Config)[] = ['emailPass'];
  for (const key of Object.keys(config) as (keyof Config)[]) {
    printInfo(
      `config | ${key} = ${
        SECRET_CONFIG_KEYS.includes(key)
          ? '*'.repeat(String(config[key]).length)
          : config[key]
      }`,
    );
  }

  schedule.start();

  const server = new Koa();
  if (config.mode === 'development') {
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
  http.createServer(server.callback()).listen(config.port);
}

export default {
  start,
};
