import cluster from 'cluster';
import http from 'http';
import Koa from 'koa';
import mount from 'koa-mount';
import api from './api';
import asset from './asset';
import pwa from './pwa';
import config from './config';
import schedule from './schedule';

async function start() {
  if (cluster.isPrimary) {
    schedule.start();

    for (let i = 0; i < config.clusterCount; i += 1) {
      cluster.fork();
    }
  } else {
    const server = new Koa();

    server.use(mount('/', pwa));
    server.use(mount('/api', api));
    server.use(mount('/assets', asset));

    http.createServer(server.callback()).listen(config.port);
  }
}

start();
