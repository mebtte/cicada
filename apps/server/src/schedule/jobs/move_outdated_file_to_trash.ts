import fs from 'fs/promises';
import { TRASH_DIR, DB_SNAPSHOT_DIR } from '@/constants/directory';
import withTimeout from '#/utils/with_timeout';
import mv from '#/utils/mv';

const DIRECTORIES: {
  directory: string;
  ttl: number;
}[] = [
  {
    directory: DB_SNAPSHOT_DIR,
    ttl: 1000 * 60 * 60 * 24 * 60,
  },
];

async function moveOutdatedFileToTrash() {
  for (const { directory, ttl } of DIRECTORIES) {
    const files = await fs.readdir(directory);
    for (const file of files) {
      const absolutePath = `${directory}/${file}`;
      const stat = await fs.stat(absolutePath);
      if (Date.now() - stat.birthtimeMs >= ttl) {
        await mv(absolutePath, `${TRASH_DIR}/${file}`);
      }
    }
  }
}

export default withTimeout(moveOutdatedFileToTrash, 60 * 1000);
