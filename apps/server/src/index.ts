import cluster from 'cluster';
import http from 'http';
import Koa from 'koa';
import log from 'koa-logger';
import mount from 'koa-mount';
import config from '#/config';
import api from './api';
import asset from './asset';
import pwa from './pwa';
import schedule from './schedule';
import env from './env';

async function start() {
  if (cluster.isPrimary) {
    const PRINT_CONFIG_KEYS = [
      'serverPort',
      'serverAddress',
      'serverBase',
      'serverClusterCount',
    ];
    for (const key of PRINT_CONFIG_KEYS) {
      // eslint-disable-next-line no-console
      console.log(`--- config | ${key} = ${config[key]} ---`);
    }

    const PRINT_ENV_KEYS = ['development'];
    for (const key of PRINT_ENV_KEYS) {
      // eslint-disable-next-line no-console
      console.log(`--- env | ${key} = ${env[key]} ---`);
    }

    schedule.start();

    for (let i = 0; i < config.serverClusterCount; i += 1) {
      cluster.fork();
    }
  } else {
    const server = new Koa();

    if (env.development) {
      server.use(log());
    }

    server.use(mount('/assets', asset));
    server.use(mount('/api', api));
    server.use(mount('/', pwa));

    http.createServer(server.callback()).listen(config.serverPort);
  }
}

start();
