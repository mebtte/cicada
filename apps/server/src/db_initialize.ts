import fs from 'fs';
import { DB_FILE_PATH } from './constants';
import { run } from './platform/db';

const TABLE_USER = `
  CREATE TABLE user (
    id TEXT PRIMARY KEY NOT NULL,
    email TEXT UNIQUE NOT NULL,
    avatar TEXT NOT NULL DEFAULT '',
    nickname TEXT NOT NULL,
    joinTimestamp INTEGER NOT NULL,
    super INTEGER NOT NULL DEFAULT 0,
    remark TEXT NOT NULL DEFAULT ''
  );
`;
const TABLE_CAPTCHA = `
  CREATE TABLE captcha (
    id TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL,
    createTimestamp INTEGER NOT NULL,
    used INTEGER NOT NULL DEFAULT 0
  );
`;
const TABLE_LOGIN_CODE = `
  CREATE TABLE login_code (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT NOT NULL,
    code TEXT NOT NULL,
    createTimestamp INTEGER NOT NULL,
    used INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT fkUser FOREIGN KEY ( userId ) REFERENCES user ( id ) 
  );
`;

async function dbInitialize() {
  if (!fs.existsSync(DB_FILE_PATH)) {
    fs.writeFileSync(DB_FILE_PATH, '');
  }
  if (!fs.readFileSync(DB_FILE_PATH).length) {
    /** 注意表创建顺序 */
    const TABLES = [TABLE_USER, TABLE_CAPTCHA, TABLE_LOGIN_CODE];
    for (const table of TABLES) {
      await run(table);
    }
  }
}

export default dbInitialize;
