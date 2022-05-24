/**
 * 初始化
 * 需要保证依赖的其他模块不依赖初始化生成的产物
 * @author mebtte<hi@mebtte.com>
 */
import cluster from 'cluster';
import * as sqlite3 from 'sqlite3';
import fs from 'fs';
import readline from 'readline';
import { EMAIL } from '#/constants/regexp';
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

if (cluster.isPrimary) {
  /**
   * 目录
   * 注意顺序
   */
  const directories = [
    argv.base,
    ASSET_DIR.ROOT,
    ASSET_DIR.USER_AVATAR,
    ASSET_DIR.CHARACTER_AVATAR,
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
  setTimeout(async () => {
    if (!fs.existsSync(DB_FILE_PATH) || !fs.readFileSync(DB_FILE_PATH).length) {
      let superUserEmail = '';
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false,
      });
      while (!superUserEmail) {
        superUserEmail = await new Promise((resolve) =>
          rl.question('❓ 请输入超级用户邮箱: ', (input) => resolve(input)),
        );
        if (superUserEmail && !EMAIL.test(superUserEmail)) {
          // eslint-disable-next-line no-console
          console.log(`⚠️ 「${superUserEmail}」不是合法的邮箱`);
          superUserEmail = '';
        }
      }
      rl.close();

      const db = new sqlite3.Database(DB_FILE_PATH);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const run = (sql: string, params?: any) =>
        new Promise<void>((resolve, reject) =>
          db.run(sql, params, (error) => (error ? reject(error) : resolve())),
        );
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

      const TABLE_CHARACTER = `
        CREATE TABLE character (
          id TEXT PRIMARY KEY NOT NULL,
          avatar TEXT NOT NULL DEFAULT '',
          name TEXT NOT NULL,
          alias TEXT NOT NULL DEFAULT '',
          createUserId TEXT NOT NULL,
          createTimestamp INTEGER NOT NULL,
          CONSTRAINT fkUser FOREIGN KEY ( createUserId ) REFERENCES user ( id )
        );
      `;
      const TABLE_CHARACTER_MODIFY_RECORD = `
        CREATE TABLE character_modify_record (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          characterId TEXT NOT NULL,
          modifyUserId TEXT NOT NULL,
          value TEXT NOT NULL,
          modifyTimestamp INTEGER NOT NULL,
          CONSTRAINT fkCharacter FOREIGN KEY ( characterId ) REFERENCES character ( id ),
          CONSTRAINT fkUser FOREIGN KEY ( modifyUserId ) REFERENCES user ( id )
        );
      `;

      /** 注意表创建顺序 */
      const TABLES = [
        TABLE_USER,
        TABLE_CAPTCHA,
        TABLE_LOGIN_CODE,
        TABLE_CHARACTER,
        TABLE_CHARACTER_MODIFY_RECORD,
      ];
      for (const table of TABLES) {
        await run(table);
      }

      /** 插入超级用户 */
      await run(
        `
          insert into user(id, email, nickname, joinTimestamp, super)
            values(?, ?, ?, ?, 1)
        `,
        ['pangu', superUserEmail, 'pangu', Date.now()],
      );

      // eslint-disable-next-line no-console
      console.log(`🎉 现在你可以使用「${superUserEmail}」登录了`);
    }
  }, 0);
}
