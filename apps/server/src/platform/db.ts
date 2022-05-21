/**
 * API referrence: https://github.com/TryGhost/node-sqlite3/wiki/API
 */
import fs from 'fs';
import util from 'util';
import * as sqlite3 from 'sqlite3';
import day from '#/utils/day';
import color from 'colors/safe';
import { DB_LOG_DIR } from '@/constants/directory';
import { DB_FILE_PATH } from '../constants';
import env from '../env';

const appendFileAsync = util.promisify(fs.appendFile);
const db = new sqlite3.Database(DB_FILE_PATH);

db.on('profile', (sql, ms) => {
  const now = day();
  const dateString = now.format('YYYYMMDD');
  const timeString = now.format('HH:mm:ss');

  if (env.RUNENV === 'development') {
    // eslint-disable-next-line no-console
    console.log(`[${timeString}] ${color.underline(`${ms}ms`)}\n${sql}`);
  }

  appendFileAsync(
    `${DB_LOG_DIR}/${dateString}.log`,
    `[${timeString}] ${ms}ms\n${sql}\n\n`,
  ).catch((error) => console.error(error));
});

export default db;
