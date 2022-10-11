import './initialize';
import cluster from 'cluster';
import http from 'http';
import Koa from 'koa';
import log from 'koa-logger';
import cors from '@koa/cors';
import mount from 'koa-mount';
import { PathPrefix } from '#/constants';
import apiApp from './api_app';
import blobApp from './blob_app';
import assetApp from './asset_app';
import pwaApp from './pwa_app';
import schedule from './schedule';
import env from './env';
import downloadApp from './download_app';
import config from './config';
import requirementCheck from './requirement_check';

function printInfo(info: string) {
  // eslint-disable-next-line no-console
  console.log(`--- ${info} ---`);
}

async function start() {
  if (cluster.isPrimary) {
    requirementCheck();

    const PRINT_ENV_KEYS: (keyof typeof env)[] = ['VERSION', 'RUN_ENV'];
    for (const key of PRINT_ENV_KEYS) {
      printInfo(`env | ${key} = ${env[key]}`);
    }

    const PRINT_CONFIG_KEYS: (keyof typeof config)[] = [
      'base',
      'port',
      'publicAddress',
      'clusterCount',
    ];
    for (const key of PRINT_CONFIG_KEYS) {
      printInfo(`config | ${key} = ${config[key]}`);
    }

    schedule.start();
    for (let i = 0; i < config.clusterCount; i += 1) {
      cluster.fork();
    }
  } else {
    const server = new Koa();

    if (env.RUN_ENV === 'development') {
      server.use(log());
    }

    server.use(
      cors({
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
}

start();
