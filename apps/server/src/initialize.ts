/**
 * 初始化
 * 需要保证依赖的其他模块不依赖初始化生成的产物
 * @author mebtte<hi@mebtte.com>
 */
import * as sqlite3 from 'sqlite3';
import fs from 'fs';
import generateRandomString from '#/utils/generate_random_string';
import {
  LOGIN_CODE_SALT_FILE_PATH,
  JWT_SECRET_FILE_PATH,
  DB_FILE_PATH,
} from './constants';
import {
  ASSET_DIR,
  DB_LOG_DIR,
  DB_SNAPSHOT_DIR,
  SCHEDULE_LOG_DIR,
  ERROR_LOG_DIR,
} from './constants/directory';
import argv from './argv';

function mkdirIfNotExist(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
}

/**
 * 目录
 * 注意顺序
 */
const directories = [
  argv.base,
  ASSET_DIR.ROOT,
  ASSET_DIR.USER_AVATAR,
  DB_LOG_DIR,
  DB_SNAPSHOT_DIR,
  SCHEDULE_LOG_DIR,
  ERROR_LOG_DIR,
];
for (const directory of directories) {
  mkdirIfNotExist(directory);
}

/** 登录验证码盐 */
if (!fs.existsSync(LOGIN_CODE_SALT_FILE_PATH)) {
  const salt = generateRandomString();
  fs.writeFileSync(LOGIN_CODE_SALT_FILE_PATH, salt);
}

/** JWT secret */
if (!fs.existsSync(JWT_SECRET_FILE_PATH)) {
  const secret = generateRandomString(64);
  fs.writeFileSync(JWT_SECRET_FILE_PATH, secret);
}

/** 数据库 */
if (!fs.existsSync(DB_FILE_PATH)) {
  const db = new sqlite3.Database(DB_FILE_PATH);
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

  /** 注意表创建顺序 */
  const TABLES = [TABLE_USER, TABLE_CAPTCHA, TABLE_LOGIN_CODE];
  for (const table of TABLES) {
    db.run(table);
  }
}
