/**
 * API referrence: https://github.com/TryGhost/node-sqlite3/wiki/API
 */
import fs from 'fs';
import util from 'util';
import * as sqlite3 from 'sqlite3';
import day from '#/utils/day';
import { LOG_DIR } from '@/constants/directory';
import { DB_FILE_PATH } from '../constants';

const appendFileAsync = util.promisify(fs.appendFile);
const db = new sqlite3.Database(DB_FILE_PATH);

db.on('profile', (sql, ms) => {
  const now = day();
  const dateString = now.format('YYYYMMDD');
  const timeString = now.format('HH:mm:ss');

  const trimedSQL = sql.replace(/\s+/g, ' ').trim();

  appendFileAsync(
    `${LOG_DIR}/db_${dateString}.log`,
    `[${timeString}] ${ms}ms\n${trimedSQL}\n\n`,
  ).catch((error) => console.error(error));
});

export default db;

export function run(sql: string, params?: unknown) {
  return new Promise<void>((resolve, reject) =>
    db.run(sql, params, (error) => (error ? reject(error) : resolve())),
  );
}

export function get<Row = unknown>(sql: string, params?: unknown) {
  return new Promise<Row | null>((resolve, reject) =>
    db.get(sql, params, (error: Error | null, row?: Row) =>
      error ? reject(error) : resolve(row || null),
    ),
  );
}

export function all<Row = unknown>(sql: string, params?: unknown) {
  return new Promise<Row[]>((resolve, reject) =>
    db.all(sql, params, (error, rows) =>
      error ? reject(error) : resolve(rows),
    ),
  );
}
