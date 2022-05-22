import fs from 'fs';
import {
  ASSET_DIR,
  DB_LOG_DIR,
  DB_SNAPSHOT_DIR,
  SCHEDULE_LOG_DIR,
  ERROR_LOG_DIR,
} from './constants/directory';
import argv from './argv';
import dbInitialize from './db_initialize';

function directoryInitialize() {
  /** 需要注意目录顺序 */
  const directories = [
    argv.base,
    ASSET_DIR.ROOT,
    ASSET_DIR.USER_AVATAR,
    DB_LOG_DIR,
    DB_SNAPSHOT_DIR,
    SCHEDULE_LOG_DIR,
    ERROR_LOG_DIR,
  ];
  for (const d of directories) {
    if (!fs.existsSync(d)) {
      fs.mkdirSync(d);
    }
  }
}

async function initialize() {
  directoryInitialize();
  await dbInitialize();
}
export default initialize;
