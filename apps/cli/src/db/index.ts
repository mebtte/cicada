import fs from 'fs';
import util from 'util';
import day from '#/utils/day';
import { getDBFilePath, getLogDirectory } from '@/config';
import DB, { EventType } from '../utils/db';

let db: DB;
const appendFileAsync = util.promisify(fs.appendFile);

export function getDB() {
  if (!db) {
    db = new DB(getDBFilePath());

    db.listen(EventType.PROFILE, (sql, ms) => {
      const now = day();
      const dateString = now.format('YYYYMMDD');
      const timeString = now.format('HH:mm:ss');

      const trimedSQL = sql.replace(/\s+/g, ' ').trim();

      appendFileAsync(
        `${getLogDirectory()}/db_${dateString}.log`,
        `[${timeString}] ${ms}ms\n${trimedSQL}\n\n`,
      ).catch((error) => console.error(error));
    });
  }

  return db;
}
