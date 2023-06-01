import fs from 'fs';
import util from 'util';
import withTimeout from '#/utils/with_timeout';
import {
  getCacheDirectory,
  getDBSnapshotDirectory,
  getLogDirectory,
  getTrashDirectory,
} from '@/config';

const readdirAsync = util.promisify(fs.readdir);
const rmAsync = util.promisify(fs.rm);
const statAsync = util.promisify(fs.stat);

async function cleanOutdatedFile() {
  const DIRECTORIES: {
    directory: string;
    ttl: number;
  }[] = [
    {
      directory: getTrashDirectory(),
      ttl: 1000 * 60 * 60 * 24 * 30,
    },
    {
      directory: getLogDirectory(),
      ttl: 1000 * 60 * 60 * 24 * 30,
    },
    {
      directory: getDBSnapshotDirectory(),
      ttl: 1000 * 60 * 60 * 24 * 15,
    },
    {
      directory: getCacheDirectory(),
      ttl: 1000 * 60 * 60 * 24 * 30,
    },
  ];
  for (const { directory, ttl } of DIRECTORIES) {
    const files = await readdirAsync(directory);
    for (const file of files) {
      const absolutePath = `${directory}/${file}`;
      const stat = await statAsync(absolutePath);
      if (Date.now() - stat.birthtimeMs >= ttl) {
        await rmAsync(absolutePath, {
          recursive: true,
          force: true,
        });
      }
    }
  }
}

export default withTimeout(cleanOutdatedFile, 60 * 1000);
