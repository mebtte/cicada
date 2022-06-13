import fs from 'fs';
import util from 'util';
import { DELETED_MUSICBILL_DIR } from '@/constants/directory';
import withTimeout from '#/utils/with_timeout';

const TTL = 1000 * 60 * 60 * 24 * 180;
const readdirAsync = util.promisify(fs.readdir);
const rmAsync = util.promisify(fs.rm);
const statAsync = util.promisify(fs.stat);

async function removeOutdatedDeletedMusicbill() {
  const files = await readdirAsync(DELETED_MUSICBILL_DIR);
  for (const file of files) {
    const absolutePath = `${DELETED_MUSICBILL_DIR}/${file}`;
    const stat = await statAsync(absolutePath);
    if (stat.isDirectory() || Date.now() - stat.birthtimeMs >= TTL) {
      await rmAsync(absolutePath, {
        recursive: true,
        force: true,
      });
    }
  }
}

export default withTimeout(removeOutdatedDeletedMusicbill, 60 * 1000);
