import fs from 'fs';
import util from 'util';
import {
  ASSET_LOG_DIR,
  DB_LOG_DIR,
  ERROR_LOG_DIR,
  TRASH_DIR,
  SCHEDULE_LOG_DIR,
  DB_SNAPSHOT_DIR,
} from '@/constants/directory';
import withTimeout from '#/utils/with_timeout';

const DIRECTORIES: {
  directory: string;
  ttl: number;
}[] = [
  {
    directory: ASSET_LOG_DIR,
    ttl: 1000 * 60 * 60 * 24 * 30,
  },
  {
    directory: ERROR_LOG_DIR,
    ttl: 1000 * 60 * 60 * 24 * 30,
  },
  {
    directory: SCHEDULE_LOG_DIR,
    ttl: 1000 * 60 * 60 * 24 * 7,
  },
  {
    directory: DB_LOG_DIR,
    ttl: 1000 * 60 * 60 * 24 * 7,
  },
  {
    directory: DB_SNAPSHOT_DIR,
    ttl: 1000 * 60 * 60 * 24 * 60,
  },
];
const readdirAsync = util.promisify(fs.readdir);
const statAsync = util.promisify(fs.stat);
const rmAsync = util.promisify(fs.rm);
const cpAsync = util.promisify(fs.cp);
const mvAsync = async (source: string, dest: string) => {
  await cpAsync(source, dest);
  await rmAsync(source);
};

async function moveOutdatedFileToTrash() {
  for (const { directory, ttl } of DIRECTORIES) {
    const files = await readdirAsync(directory);
    for (const file of files) {
      const absolutePath = `${directory}/${file}`;
      const stat = await statAsync(absolutePath);
      if (Date.now() - stat.birthtimeMs >= ttl) {
        await mvAsync(absolutePath, `${TRASH_DIR}/${file}`);
      }
    }
  }
}

export default withTimeout(moveOutdatedFileToTrash, 60 * 3000);
