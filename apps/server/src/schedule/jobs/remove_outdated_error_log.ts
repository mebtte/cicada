import fs from 'fs';
import util from 'util';
import { ERROR_LOG_DIR } from '@/constants/directory';

const TTL = 1000 * 60 * 60 * 24 * 90;
const readdirAsync = util.promisify(fs.readdir);
const rmAsync = util.promisify(fs.rm);
const statAsync = util.promisify(fs.stat);

async function removeOutdatedErrorLog() {
  const files = await readdirAsync(ERROR_LOG_DIR);
  for (const file of files) {
    const absolutePath = `${ERROR_LOG_DIR}/${file}`;
    const stat = await statAsync(absolutePath);
    if (stat.isDirectory() || Date.now() - stat.birthtimeMs >= TTL) {
      await rmAsync(absolutePath, {
        recursive: true,
        force: true,
      });
    }
  }
}

export default removeOutdatedErrorLog;
