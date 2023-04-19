import fs from 'fs';
import { EMAIL } from '#/constants/regexp';
import question from '#/utils/question';
import { AssetTypeV1 } from '#/constants';
import DB from './utils/db';
import {
  getAssetDirectory,
  getConfig,
  getDBFilePath,
  getDBSnapshotDirectory,
  getDownloadDirectory,
  getLogDirectory,
  getTrashDirectory,
  getCacheDirectory,
  getDataVersionPath,
} from './config';
import exitWithMessage from './utils/exit_with_message';
import { DATA_VERSION } from './constants';
import {
  MusicProperty,
  MUSIC_TABLE_NAME,
  UserProperty,
  USER_TABLE_NAME,
} from './constants/db_definition';

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
    getConfig().data,
    getDBSnapshotDirectory(),
    getTrashDirectory(),
    getLogDirectory(),
    getDownloadDirectory(),
    getCacheDirectory(),

    getAssetDirectory(),
    ...Object.values(AssetTypeV1).map((at) => getAssetDirectory(at)),
  ];
  for (const directory of directories) {
    mkdirIfNotExist(directory);
  }

  /**
   * initialize or verify data version
   * @author mebtte<hi@mebtte.com>
   */
  if (fs.existsSync(getDataVersionPath())) {
    const dataVersion = Number(
      fs.readFileSync(getDataVersionPath()).toString().replace(/\s/gm, ''),
    );
    if (dataVersion !== DATA_VERSION) {
      return exitWithMessage(
        `当前数据版本为 v${dataVersion}, 请使用 v${
          dataVersion + 1
        } 版本的知了通过 [cicada data-upgrade <data>] 升级数据后再启动服务`,
      );
    }
  } else {
    fs.writeFileSync(getDataVersionPath(), DATA_VERSION.toString());
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
      CREATE TABLE ${USER_TABLE_NAME} (
        ${UserProperty.ID} TEXT PRIMARY KEY NOT NULL,
        ${UserProperty.EMAIL} TEXT UNIQUE NOT NULL,
        ${UserProperty.AVATAR} TEXT NOT NULL DEFAULT '',
        ${UserProperty.NICKNAME} TEXT NOT NULL,
        ${UserProperty.JOIN_TIMESTAMP} INTEGER NOT NULL,
        ${UserProperty.ADMIN} INTEGER NOT NULL DEFAULT 0,
        ${UserProperty.REMARK} TEXT NOT NULL DEFAULT '',
        ${UserProperty.MUSICBILL_ORDERS_JSON} TEXT DEFAULT NULL,
        ${UserProperty.MUSICBILL_MAX_AMOUNT} INTEGER NOT NULL DEFAULT 100,
        ${UserProperty.CREATE_MUSIC_MAX_AMOUNT_PER_DAY} INTEGER NOT NULL DEFAULT 10,
        ${UserProperty.EXPORT_MUSICBILL_MAX_TIME_PER_DAY} INTEGER NOT NULL DEFAULT 3
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
      CREATE TABLE ${MUSIC_TABLE_NAME} (
        ${MusicProperty.ID} TEXT PRIMARY KEY NOT NULL,
        ${MusicProperty.TYPE} INTEGER NOT NULL,
        ${MusicProperty.NAME} TEXT NOT NULL,
        ${MusicProperty.ALIASES} TEXT NOT NULL DEFAULT '',
        ${MusicProperty.COVER} TEXT NOT NULL DEFAULT '',
        ${MusicProperty.ASSET} TEXT NOT NULL,
        ${MusicProperty.HEAT} INTEGER NOT NULL DEFAULT 0,
        ${MusicProperty.CREATE_USER_ID} TEXT NOT NULL,
        ${MusicProperty.CREATE_TIMESTAMP} INTEGER NOT NULL,

        CONSTRAINT fk_${TABLE_USER} FOREIGN KEY ( ${MusicProperty.CREATE_USER_ID} ) REFERENCES ${TABLE_USER} ( ${UserProperty.ID} )
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
        accessOrigin TEXT NOT NULL,
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
        INSERT INTO user( id, email, nickname, joinTimestamp, admin )
          VALUES ( ?, ?, ?, ?, 1 )
      `,
      ['1', adminEmail, 'Admin', Date.now()],
    );

    // eslint-disable-next-line no-console
    console.log(`🎉 现在你可以使用「${adminEmail}」登录了`);
  }
};
