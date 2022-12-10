import fs from 'fs';
import util from 'util';
import withTimeout from '#/utils/with_timeout';
import { DOWNLOAD_TTL } from '#/constants';
import {
  getDBSnapshotDirectory,
  getDownloadDirectory,
  getLogDirectory,
  getTrashDirectory,
} from '@/config';

const readdirAsync = util.promisify(fs.readdir);
const rmAsync = util.promisify(fs.rm);
const statAsync = util.promisify(fs.stat);
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
    directory: getDownloadDirectory(),
    ttl: DOWNLOAD_TTL,
  },
  {
    directory: getDBSnapshotDirectory(),
    ttl: 1000 * 60 * 60 * 24 * 60,
  },
];

async function cleanOutdatedFile() {
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
