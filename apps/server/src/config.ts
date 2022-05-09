/* eslint-disable no-console */
import cluster from 'cluster';
import config from '../../../config';

if (cluster.isPrimary) {
  console.log('----------');
  for (const key of ['port', 'clusterCount']) {
    console.log(`${key}: ${config[key]}`);
  }
  console.log('----------');
}

export default config as {
  port: number;
  serverAddress: string;
  base: string;
  clusterCount: number;
};
