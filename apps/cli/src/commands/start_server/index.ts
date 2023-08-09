import http from 'http';
import Koa from 'koa';
import log from 'koa-logger';
import cors from '@koa/cors';
import mount from 'koa-mount';
import { PathPrefix } from '#/constants';
import { updateConfigFromFile, getConfig, Config } from '@/config';
import definition from '@/definition';
import initialize from './initialize';
import schedule from './schedule';
import { getAssetApp } from './asset_app';
import { getApiApp } from './api_app';
import { getFormApp } from './form_app';
import { getPwaApp } from './pwa_app';
import { getBaseApp } from './base_app';
import i18n from './middlewares/i18n';

function printInfo(info: string) {
  // eslint-disable-next-line no-console
  console.log(`--- ${info} ---`);
}

async function startServer({ configFilePath }: { configFilePath: string }) {
  updateConfigFromFile(configFilePath);

  await initialize();

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

  schedule.start();

  const server = new Koa();
  server.use(log());
  server.use(i18n);
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

  server.use(mount(`/${PathPrefix.ASSET}`, getAssetApp()));
  server.use(mount(`/${PathPrefix.FORM}`, getFormApp()));
  server.use(mount(`/${PathPrefix.API}`, getApiApp()));
  server.use(mount(`/${PathPrefix.BASE}`, getBaseApp()));

  /**
   * 非构建模式下不用托管 pwa
   * @author mebtte<hi@mebtte.com>
   */
  if (definition.BUILT) {
    server.use(mount('/', getPwaApp()));
  }

  http.createServer(server.callback()).listen(config.port);
}

export default startServer;
