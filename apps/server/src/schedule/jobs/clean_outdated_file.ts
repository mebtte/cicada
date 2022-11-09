import fs from 'fs';
import util from 'util';
import {
  TRASH_DIR,
  LOG_DIR,
  DOWNLOAD_DIR,
  DB_SNAPSHOT_DIR,
} from '@/constants/directory';
import withTimeout from '#/utils/with_timeout';
import { DOWNLOAD_TTL } from '#/constants';

const readdirAsync = util.promisify(fs.readdir);
const rmAsync = util.promisify(fs.rm);
const statAsync = util.promisify(fs.stat);
const DIRECTORIES: {
  directory: string;
  ttl: number;
}[] = [
  {
    directory: TRASH_DIR,
    ttl: 1000 * 60 * 60 * 24 * 30,
  },
  {
    directory: LOG_DIR,
    ttl: 1000 * 60 * 60 * 24 * 30,
  },
  {
    directory: DOWNLOAD_DIR,
    ttl: DOWNLOAD_TTL,
  },
  {
    directory: DB_SNAPSHOT_DIR,
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
