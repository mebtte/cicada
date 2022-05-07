/* eslint-disable no-console */
import cluster from 'cluster';
import os from 'os';
import app from './app';
import config from './config';
import env from './env';

async function initialize() {}

async function start() {
  if (cluster.isPrimary) {
    console.log(`---port: ${config.port}---`);

    await initialize();

    const clusterCount = env.development ? 1 : os.cpus().length;
    console.log(`---clusterCount: ${clusterCount}---`);
    for (let i = 0; i < clusterCount; i += 1) {
      cluster.fork();
    }
  } else {
    app.start(config.port);
  }
}

start();
