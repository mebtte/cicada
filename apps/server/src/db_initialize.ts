import fs from 'fs';
import { DB_FILE_PATH } from './constants';
import db from './platform/db';

const TABLE_CAPTCHA = `CREATE TABLE captcha (\n  id text PRIMARY KEY NOT NULL,\n  value text NOT NULL,\n  createTimestamp int NOT NULL\n);
`;

async function dbInitialize() {
  if (!fs.readFileSync(DB_FILE_PATH).length) {
    /** 注意表创建顺序 */
    const TABLES = [TABLE_CAPTCHA];
    for (const table of TABLES) {
      await new Promise<void>((resolve, reject) =>
        db.run(table, (error) => (error ? reject(error) : resolve())),
      );
    }
  }
}

export default dbInitialize;
