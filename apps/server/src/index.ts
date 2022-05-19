import cluster from 'cluster';
import http from 'http';
import Koa from 'koa';
import mount from 'koa-mount';
import config from '#/config';
import api from './api';
import asset from './asset';
import pwa from './pwa';
import schedule from './schedule';

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

    schedule.start();

    for (let i = 0; i < config.serverClusterCount; i += 1) {
      cluster.fork();
    }
  } else {
    const server = new Koa();

    server.use(mount('/', pwa));
    server.use(mount('/api', api));
    server.use(mount('/assets', asset));

    http.createServer(server.callback()).listen(config.serverPort);
  }
}

start();
