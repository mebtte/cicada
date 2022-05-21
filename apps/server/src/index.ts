import cluster from 'cluster';
import http from 'http';
import Koa from 'koa';
import log from 'koa-logger';
import mount from 'koa-mount';
import argv from './argv';
import api from './api';
import asset from './asset';
import pwa from './pwa';
import schedule from './schedule';
import env from './env';
import initialize from './initialize';

async function start() {
  if (cluster.isPrimary) {
    process.title = 'cicada_primary';

    const PRINT_ARGV_KEYS = ['base', 'port', 'publicAddress', 'clusterCount'];
    for (const key of PRINT_ARGV_KEYS) {
      // eslint-disable-next-line no-console
      console.log(`--- argv | ${key} = ${argv[key]} ---`);
    }

    const PRINT_ENV_KEYS = ['RUNENV'];
    for (const key of PRINT_ENV_KEYS) {
      // eslint-disable-next-line no-console
      console.log(`--- env | ${key} = ${env[key]} ---`);
    }

    await initialize();

    schedule.start();

    for (let i = 0; i < argv.clusterCount; i += 1) {
      cluster.fork();
    }
  } else {
    process.title = 'cicada_worker';

    const server = new Koa();

    if (env.RUNENV === 'development') {
      server.use(log());
    }

    server.use(mount('/assets', asset));
    server.use(mount('/api', api));
    server.use(mount('/', pwa));

    http.createServer(server.callback()).listen(argv.port);
  }
}

start();
