import './initialize';
import cluster from 'cluster';
import http from 'http';
import Koa from 'koa';
import log from 'koa-logger';
import cors from '@koa/cors';
import mount from 'koa-mount';
import { PathPrefix } from '#/constants';
import api from './api';
import blob from './blob';
import asset from './asset';
import pwa from './pwa';
import schedule from './schedule';
import env from './env';
import temporary from './temporary';
import config from './config';

async function start() {
  if (cluster.isPrimary) {
    process.title = 'cicada_primary';

    const PRINT_ENV_KEYS: (keyof typeof env)[] = ['RUN_ENV'];
    for (const key of PRINT_ENV_KEYS) {
      // eslint-disable-next-line no-console
      console.log(`--- env | ${key} = ${env[key]} ---`);
    }

    const PRINT_CONFIG_KEYS: (keyof typeof config)[] = [
      'base',
      'port',
      'publicAddress',
      'clusterCount',
    ];
    for (const key of PRINT_CONFIG_KEYS) {
      // eslint-disable-next-line no-console
      console.log(`--- argv | ${key} = ${config[key]} ---`);
    }

    schedule.start();
    for (let i = 0; i < config.clusterCount; i += 1) {
      cluster.fork();
    }
  } else {
    process.title = 'cicada_worker';

    const server = new Koa();

    if (env.RUN_ENV === 'development') {
      server.use(log());
    }

    server.use(
      cors({
        credentials: true,
      }),
    );
    server.use(mount(`/${PathPrefix.ASSET}`, asset));
    server.use(mount(`/${PathPrefix.TEMPORARY}`, temporary));
    server.use(mount(`/${PathPrefix.API}`, api));
    server.use(mount(`/${PathPrefix.BLOB}`, blob));
    server.use(mount('/', pwa));

    http.createServer(server.callback()).listen(config.port);
  }
}

start();
