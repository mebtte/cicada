import fs from 'fs';
import util from 'util';
import { TRASH_DIR } from '@/constants/directory';
import withTimeout from '#/utils/with_timeout';

const TTL = 1000 * 60 * 60 * 24 * 60;
const readdirAsync = util.promisify(fs.readdir);
const rmAsync = util.promisify(fs.rm);
const statAsync = util.promisify(fs.stat);

async function cleanTrash() {
  const files = await readdirAsync(TRASH_DIR);
  for (const file of files) {
    const absolutePath = `${TRASH_DIR}/${file}`;
    const stat = await statAsync(absolutePath);
    if (stat.isDirectory() || Date.now() - stat.birthtimeMs >= TTL) {
      await rmAsync(absolutePath, {
        recursive: true,
        force: true,
      });
    }
  }
}

export default withTimeout(cleanTrash, 60 * 1000);
