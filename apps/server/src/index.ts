/* eslint-disable no-console */
import cluster from 'cluster';
import http from 'http';
import os from 'os';
import Koa from 'koa';
import mount from 'koa-mount';
import api from './api';
import asset from './asset';
import pwa from './pwa';
import config from './config';
import env from './env';
import schedule from './schedule';

async function start() {
  if (cluster.isPrimary) {
    console.log(`--- port: ${config.port} ---`);

    schedule.start();

    const clusterCount = env.development ? 1 : os.cpus().length;
    console.log(`--- clusterCount: ${clusterCount} ---`);
    for (let i = 0; i < clusterCount; i += 1) {
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
