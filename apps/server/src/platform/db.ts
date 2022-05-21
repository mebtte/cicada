/**
 * API referrence: https://github.com/TryGhost/node-sqlite3/wiki/API
 */
import fs from 'fs';
import util from 'util';
import * as sqlite3 from 'sqlite3';
import config from '#/config';
import day from '#/utils/day';
import color from 'colors/safe';
import env from '../env';

const LOG_DIR = `${config.serverBase}/db_logs`;
const appendFileAsync = util.promisify(fs.appendFile);

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR);
}

if (env.development) {
  sqlite3.verbose();
}

const db = new sqlite3.Database(`${config.serverBase}/db`);
db.on('profile', (sql, ms) => {
  const now = day();
  const dateString = now.format('YYYYMMDD');
  const timeString = now.format('HH:mm:ss');

  if (env.development) {
    // eslint-disable-next-line no-console
    console.log(`[${timeString}] ${color.underline(`${ms}ms`)} ${sql}`);
  }

  appendFileAsync(
    `${LOG_DIR}/${dateString}.log`,
    `[${timeString}] ${ms}ms\n${sql}\n\n`,
  ).catch((error) => console.error(error));
});

export default db;
