import fs from 'fs';
import { EMAIL } from '#/constants/regexp';
import DB from '#/utils/db';
import question from '#/utils/question';
import { AssetType } from '#/constants';
import {
  getAssetDirectory,
  getConfig,
  getDBFilePath,
  getDBSnapshotDirectory,
  getDownloadDirectory,
  getLogDirectory,
  getTrashDirectory,
} from './config';

function mkdirIfNotExist(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export default async () => {
  /**
   * create directory
   * @author mebtte<hi@mebtte.com>
   */
  const directories = [
    getConfig().base,
    getDBSnapshotDirectory(),
    getTrashDirectory(),
    getLogDirectory(),
    getDownloadDirectory(),

    getAssetDirectory(),
    ...Object.values(AssetType).map((at) => getAssetDirectory(at)),
  ];
  for (const directory of directories) {
    mkdirIfNotExist(directory);
  }

  /**
   * initialize database
   * @author mebtte<hi@mebtte.com>
   */
  if (
    !fs.existsSync(getDBFilePath()) ||
    !fs.readFileSync(getDBFilePath()).length
  ) {
    const db = new DB(getDBFilePath());
    const TABLE_USER = `
      CREATE TABLE user (
        id TEXT PRIMARY KEY NOT NULL,
        email TEXT UNIQUE NOT NULL,
        avatar TEXT NOT NULL DEFAULT '',
        nickname TEXT NOT NULL,
        joinTimestamp INTEGER NOT NULL,
        admin INTEGER NOT NULL DEFAULT 0,
        remark TEXT NOT NULL DEFAULT '',
        musicbillOrdersJSON TEXT DEFAULT NULL
      )
    `;
    const TABLE_CAPTCHA = `
      CREATE TABLE captcha (
        id TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL,
        createTimestamp INTEGER NOT NULL,
        used INTEGER NOT NULL DEFAULT 0
      )
    `;
    const TABLE_LOGIN_CODE = `
      CREATE TABLE login_code (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT NOT NULL,
        code TEXT NOT NULL,
        createTimestamp INTEGER NOT NULL,
        used INTEGER NOT NULL DEFAULT 0,
        CONSTRAINT fkUser FOREIGN KEY ( userId ) REFERENCES user ( id )
      )
    `;
    const TABLE_SINGER = `
      CREATE TABLE singer (
        id TEXT PRIMARY KEY NOT NULL,
        avatar TEXT NOT NULL DEFAULT '',
        name TEXT NOT NULL,
        aliases TEXT NOT NULL DEFAULT '',
        createUserId TEXT NOT NULL,
        createTimestamp INTEGER NOT NULL,
        CONSTRAINT fkUser FOREIGN KEY ( createUserId ) REFERENCES user ( id )
      )
    `;
    const TABLE_SINGER_MODIFY_RECORD = `
      CREATE TABLE singer_modify_record (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        singerId TEXT NOT NULL,
        modifyUserId TEXT NOT NULL,
        key TEXT NOT NULL,
        modifyTimestamp INTEGER NOT NULL,
        CONSTRAINT fkSinger FOREIGN KEY ( singerId ) REFERENCES singer ( id ),
        CONSTRAINT fkUser FOREIGN KEY ( modifyUserId ) REFERENCES user ( id )
      )
    `;
    const TABLE_MUSIC = `
      CREATE TABLE music (
        id TEXT PRIMARY KEY NOT NULL,
        type INTEGER NOT NULL,
        name TEXT NOT NULL,
        aliases TEXT NOT NULL DEFAULT '',
        cover TEXT NOT NULL DEFAULT '',
        sq TEXT NOT NULL,
        hq TEXT NOT NULL DEFAULT '',
        ac TEXT NOT NULL DEFAULT '',
        heat INTEGER NOT NULL DEFAULT 0,
        createUserId TEXT NOT NULL,
        createTimestamp INTEGER NOT NULL,
        CONSTRAINT fkUser FOREIGN KEY ( createUserId ) REFERENCES user ( id )
      )
    `;
    const TABLE_MUSIC_MODIGY_RECORD = `
      CREATE TABLE music_modify_record (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        musicId TEXT NOT NULL,
        modifyUserId TEXT NOT NULL,
        key TEXT NOT NULL,
        modifyTimestamp INTEGER NOT NULL,
        CONSTRAINT fkMusic FOREIGN KEY ( musicId ) REFERENCES music ( id ),
        CONSTRAINT fkUser FOREIGN KEY ( modifyUserId ) REFERENCES user ( id )
      )
    `;
    const TABLE_MUSIC_FORK = `
      CREATE TABLE music_fork (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        musicId TEXT NOT NULL,
        forkFrom TEXT NOT NULL,
        CONSTRAINT fkMusic FOREIGN KEY ( musicId ) REFERENCES music ( id ),
        CONSTRAINT fkForkFrom FOREIGN KEY ( forkFrom ) REFERENCES music ( id ),
        UNIQUE( musicId, forkFrom ) ON CONFLICT REPLACE
      )
    `;
    const TABLE_LYRIC = `
      CREATE TABLE lyric (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        musicId TEXT NOT NULL,
        lrc TEXT NOT NULL,
        lrcContent TEXT NOT NULL,
        CONSTRAINT fkMusic FOREIGN KEY ( musicId ) REFERENCES music ( id ) 
      )
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
      )
    `;
    const TABLE_MUSIC_SINGER_RELATION = `
      CREATE TABLE music_singer_relation (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        musicId TEXT NOT NULL,
        singerId TEXT NOT NULL,
        CONSTRAINT fkMusic FOREIGN KEY ( musicId ) REFERENCES music ( id ),
        CONSTRAINT fkSinger FOREIGN KEY ( singerId ) REFERENCES singer ( id ),
        UNIQUE( musicId, singerId ) ON CONFLICT REPLACE
      )
    `;
    const TABLE_MUSICBILL = `
      CREATE TABLE musicbill (
        id TEXT PRIMARY KEY NOT NULL,
        userId TEXT NOT NULL,
        cover TEXT NOT NULL DEFAULT '',
        name TEXT NOT NULL,
        public INTEGER NOT NULL DEFAULT 0,
        createTimestamp INTEGER NOT NULL,
        CONSTRAINT fkUser FOREIGN KEY ( userId ) REFERENCES user ( id ) 
      )
    `;
    const TABLE_MUSICBILL_MUSIC = `
      CREATE TABLE musicbill_music (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        musicbillId TEXT NOT NULL,
        musicId TEXT NOT NULL,
        addTimestamp INTEGER NOT NULL,
        CONSTRAINT fkMusicbill FOREIGN KEY ( musicbillId ) REFERENCES musicbill ( id ),
        CONSTRAINT fkMusic FOREIGN KEY ( musicId ) REFERENCES music ( id ),
        UNIQUE( musicbillId, musicId ) ON CONFLICT REPLACE
      )
    `;
    const TABLE_MUSICBILL_COLLECTION = `
      CREATE TABLE musicbill_collection (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        musicbillId TEXT NOT NULL,
        userId TEXT NOT NULL,
        collectTimestamp INTEGER NOT NULL,
        CONSTRAINT fkMusicbill FOREIGN KEY ( musicbillId ) REFERENCES musicbill ( id ),
        CONSTRAINT fkUser FOREIGN KEY ( userId ) REFERENCES user ( id ),
        UNIQUE( musicbillId, userId ) ON CONFLICT REPLACE
      )
    `;
    const TABLE_MUSICBILL_EXPORT = `
      CREATE TABLE musicbill_export (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT NOT NULL,
        musicbillId TEXT NOT NULL,
        createTimestamp INTEGER NOT NULL,
        exportedTimestamp INTEGER DEFAULT NULL,
        CONSTRAINT fkUser FOREIGN KEY ( userId ) REFERENCES user ( id ),
        CONSTRAINT fkMusicbill FOREIGN KEY ( musicbillId ) REFERENCES musicbill ( id ) 
      )
    `;

    /** 注意表创建顺序 */
    const TABLES = [
      TABLE_USER,
      TABLE_CAPTCHA,
      TABLE_LOGIN_CODE,
      TABLE_SINGER,
      TABLE_SINGER_MODIFY_RECORD,
      TABLE_MUSIC,
      TABLE_MUSIC_MODIGY_RECORD,
      TABLE_MUSIC_FORK,
      TABLE_LYRIC,
      TABLE_MUSIC_PLAY_RECORD,
      TABLE_MUSIC_SINGER_RELATION,
      TABLE_MUSICBILL,
      TABLE_MUSICBILL_MUSIC,
      TABLE_MUSICBILL_COLLECTION,
      TABLE_MUSICBILL_EXPORT,
    ];
    for (const table of TABLES) {
      await db.run(table);
    }
  }

  /**
   * 插入超级用户
   * @author mebtte<hi@mebtte.com>
   */
  const db = new DB(getDBFilePath());
  const adminUser = await db.get('select * from user where admin = 1');
  if (!adminUser) {
    let adminEmail = getConfig().initialAdminEmail;
    while (!adminEmail) {
      adminEmail = await question('❓ 请输入管理员邮箱: ');
      if (adminEmail && !EMAIL.test(adminEmail)) {
        // eslint-disable-next-line no-console
        console.log(`⚠️ 「${adminEmail}」不是合法的邮箱`);
        adminEmail = '';
      }
    }
    await db.run(
      `
      insert into user(id, email, nickname, joinTimestamp,  admin)
        values(?, ?, ?, ?, 1)
    `,
      ['pangu', adminEmail, 'pangu', Date.now()],
    );

    // eslint-disable-next-line no-console
    console.log(`🎉 现在你可以使用「${adminEmail}」登录了`);
  }
};
