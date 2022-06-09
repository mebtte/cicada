/**
 * 初始化
 * 需要保证依赖的其他模块不依赖初始化生成的产物
 * 比如不能 import src/db
 * 因为 src/db 依赖 base 目录
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
  ROOT_ASSET_DIR,
  ASSET_DIR,
  DB_LOG_DIR,
  DB_SNAPSHOT_DIR,
  SCHEDULE_LOG_DIR,
  ERROR_LOG_DIR,
  ASSET_LOG_DIR,
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
    DB_LOG_DIR,
    DB_SNAPSHOT_DIR,
    SCHEDULE_LOG_DIR,
    ERROR_LOG_DIR,
    ASSET_LOG_DIR,

    ROOT_ASSET_DIR,
    ...Object.values(ASSET_DIR),
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
      const db = new sqlite3.Database(DB_FILE_PATH);
      const dbRun = (sql: string, params?: unknown) =>
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
      const TABLE_MUSIC = `
        CREATE TABLE music (
          id TEXT PRIMARY KEY NOT NULL,
          type INTEGER NOT NULL,
          name TEXT NOT NULL,
          alias TEXT NOT NULL DEFAULT '',
          cover TEXT NOT NULL DEFAULT '',
          sq TEXT NOT NULL,
          hq TEXT NOT NULL DEFAULT '',
          ac TEXT NOT NULL DEFAULT '',
          effectivePlayTimes INTEGER NOT NULL DEFAULT 0,
          createUserId TEXT NOT NULL,
          createTimestamp INTEGER NOT NULL,
          CONSTRAINT fkUser FOREIGN KEY ( createUserId ) REFERENCES user ( id )
        );
      `;
      const TABLE_MUSIC_MODIGY_RECORD = `
        CREATE TABLE music_modify_record (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          musicId TEXT NOT NULL,
          modifyUserId TEXT NOT NULL,
          value TEXT NOT NULL,
          modifyTimestamp INTEGER NOT NULL,
          CONSTRAINT fkMusic FOREIGN KEY ( musicId ) REFERENCES music ( id ),
          CONSTRAINT fkUser FOREIGN KEY ( modifyUserId ) REFERENCES user ( id )
        );
      `;
      const TABLE_MUSIC_FORK = `
        CREATE TABLE music_fork (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          musicId TEXT NOT NULL,
          forkFrom TEXT NOT NULL,
          CONSTRAINT fkMusic FOREIGN KEY ( musicId ) REFERENCES music ( id ),
          CONSTRAINT fkForkFrom FOREIGN KEY ( forkFrom ) REFERENCES music ( id )
        );
      `;
      const TABLE_MUSIC_LRC = `
        CREATE TABLE music_lrc (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          musicId TEXT NOT NULL,
          lrc TEXT NOT NULL,
          CONSTRAINT fkMusic FOREIGN KEY ( musicId ) REFERENCES music ( id ) 
        );
      `;
      const TABLE_MUSIC_PLAY_RECORD = `
        CREATE TABLE music_play_record (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId TEXT NOT NULL,
          musicId TEXT NOT NULL,
          percent REAL NOT NULL,
          timestamp INTEGER NOT NULL,
          CONSTRAINT fkUser FOREIGN KEY ( userId ) REFERENCES user ( id ),
          CONSTRAINT fkMusic FOREIGN KEY ( musicId ) REFERENCES music ( id ) 
        );
      `;
      const TABLE_MUSIC_SINGER_RELATION = `
        CREATE TABLE music_singer_relation (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          musicId TEXT NOT NULL,
          singerId TEXT NOT NULL,
          CONSTRAINT fkMusic FOREIGN KEY ( musicId ) REFERENCES music ( id ),
          CONSTRAINT fkSinger FOREIGN KEY ( singerId ) REFERENCES character ( id ) 
        );
      `;
      const TABLE_MUSICBILL = `
        CREATE TABLE musicbill (
          id TEXT PRIMARY KEY NOT NULL,
          userId TEXT NOT NULL,
          cover TEXT NOT NULL DEFAULT '',
          name TEXT NOT NULL,
          public INTEGER NOT NULL DEFAULT 0,
          \`order\` INTEGER NOT NULL,
          orderTimestamp INTEGER NOT NULL,
          createTimestamp INTEGER NOT NULL,
          CONSTRAINT fkUser FOREIGN KEY ( userId ) REFERENCES user ( id ) 
        );
      `;
      const TABLE_MUSICBILL_MUSIC = `
        CREATE TABLE musicbill_music (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          musicbillId TEXT NOT NULL,
          musicId TEXT NOT NULL,
          addTimestamp INTEGER NOT NULL,
          CONSTRAINT fkMusicbill FOREIGN KEY ( musicbillId ) REFERENCES musicbill ( id ),
          CONSTRAINT fkMusic FOREIGN KEY ( musicId ) REFERENCES music ( id ) 
        );
      `;

      /** 注意表创建顺序 */
      const TABLES = [
        TABLE_USER,
        TABLE_CAPTCHA,
        TABLE_LOGIN_CODE,
        TABLE_CHARACTER,
        TABLE_CHARACTER_MODIFY_RECORD,
        TABLE_MUSIC,
        TABLE_MUSIC_MODIGY_RECORD,
        TABLE_MUSIC_FORK,
        TABLE_MUSIC_LRC,
        TABLE_MUSIC_PLAY_RECORD,
        TABLE_MUSIC_SINGER_RELATION,
        TABLE_MUSICBILL,
        TABLE_MUSICBILL_MUSIC,
      ];
      for (const table of TABLES) {
        await dbRun(table);
      }
    }

    /** 插入超级用户 */
    const db = new sqlite3.Database(DB_FILE_PATH);
    const dbRun = (sql: string, params?: unknown) =>
      new Promise<void>((resolve, reject) =>
        db.run(sql, params, (error) => (error ? reject(error) : resolve())),
      );
    const dbGet = <Row = unknown>(sql: string, params?: unknown) =>
      new Promise<Row | null>((resolve, reject) =>
        db.get(sql, params, (error: Error | null, row?: Row) =>
          error ? reject(error) : resolve(row || null),
        ),
      );
    const superUser = await dbGet('select * from user where super = 1');
    if (!superUser) {
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
      await dbRun(
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
