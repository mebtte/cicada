import http from 'http';
import Koa from 'koa';
import log from 'koa-logger';
import cors from '@koa/cors';
import mount from 'koa-mount';
import { PathPrefix } from '#/constants';
import { updateConfigFromFile, getConfig, Config } from './config';
import requirementCheck from './requirement_check';

function printInfo(info: string) {
  // eslint-disable-next-line no-console
  console.log(`--- ${info} ---`);
}

async function start(configFilePath: string) {
  updateConfigFromFile(configFilePath);

  const { default: initialize } = await import('./initialize');
  await initialize();

  requirementCheck();

  const config = getConfig();
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

  const { default: schedule } = await import('./schedule');
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

  const { default: assetApp } = await import('./asset_app');
  server.use(mount(`/${PathPrefix.ASSET}`, assetApp));

  const { default: downloadApp } = await import('./download_app');
  server.use(mount(`/${PathPrefix.DOWNLOAD}`, downloadApp));

  const { default: apiApp } = await import('./api_app');
  server.use(mount(`/${PathPrefix.API}`, apiApp));

  const { default: blobApp } = await import('./blob_app');
  server.use(mount(`/${PathPrefix.BLOB}`, blobApp));

  const { default: pwaApp } = await import('./pwa_app');
  server.use(mount('/', pwaApp));

  http.createServer(server.callback()).listen(config.port);
}

export default {
  start,
};
