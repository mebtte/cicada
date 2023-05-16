import fs from 'fs';
import { EMAIL } from '#/constants/regexp';
import question from '#/utils/question';
import { AssetType } from '#/constants';
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
import {
  MusicProperty,
  MUSIC_TABLE_NAME,
  SingerProperty,
  SINGER_TABLE_NAME,
  UserProperty,
  USER_TABLE_NAME,
  CAPTCHA_TABLE_NAME,
  CaptchaProperty,
  LOGIN_CODE_TABLE_NAME,
  LoginCodeProperty,
  SINGER_MODIFY_RECORD_TABLE_NAME,
  SingerModifyRecordProperty,
  MUSIC_MODIFY_RECORD_TABLE_NAME,
  MusicModifyRecordProperty,
  MUSIC_FORK_TABLE_NAME,
  MusicForkProperty,
  LYRIC_TABLE_NAME,
  LyricProperty,
  MUSIC_PLAY_RECORD_TABLE_NAME,
  MusicPlayRecordProperty,
  MUSIC_SINGER_RELATION_TABLE_NAME,
  MusicSingerRelationProperty,
  MUSICBILL_TABLE_NAME,
  MusicbillProperty,
  MUSICBILL_MUSIC_TABLE_NAME,
  MusicbillMusicProperty,
  MUSICBILL_COLLECTION_TABLE_NAME,
  MusicbillCollectionProperty,
  MUSICBILL_EXPORT_TABLE_NAME,
  MusicbillExportProperty,
} from './constants/db_definition';

const DATA_VERSION = 1;

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
    ...Object.values(AssetType).map((at) => getAssetDirectory(at)),
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
      if (dataVersion < DATA_VERSION) {
        return exitWithMessage(
          `当前数据版本为 v${dataVersion}, 请使用 v${
            dataVersion + 1
          } 版本的知了通过 [ cicada data-upgrade <data> ] 升级数据后再启动服务`,
        );
      }
      return exitWithMessage(
        `数据版本大于 v${DATA_VERSION}, 请使用对应版本的知了提供服务`,
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
        ${UserProperty.EXPORT_MUSICBILL_MAX_TIME_PER_DAY} INTEGER NOT NULL DEFAULT 3,
        ${UserProperty.LAST_ACTIVE_TIMESTAMP} INTEGER NOT NULL DEFAULT 0,
        ${UserProperty.MUSIC_PLAY_RECORD_INDATE} INTEGER NOT NULL DEFAULT 0
      )
    `;
    const TABLE_CAPTCHA = `
      CREATE TABLE ${CAPTCHA_TABLE_NAME} (
        ${CaptchaProperty.ID} TEXT PRIMARY KEY NOT NULL,
        ${CaptchaProperty.VALUE} TEXT NOT NULL,
        ${CaptchaProperty.CREATE_TIMESTAMP} INTEGER NOT NULL,
        ${CaptchaProperty.USED} INTEGER NOT NULL DEFAULT 0
      )
    `;
    const TABLE_LOGIN_CODE = `
      CREATE TABLE ${LOGIN_CODE_TABLE_NAME} (
        ${LoginCodeProperty.ID} INTEGER PRIMARY KEY AUTOINCREMENT,
        ${LoginCodeProperty.USER_ID} TEXT NOT NULL,
        ${LoginCodeProperty.CODE} TEXT NOT NULL,
        ${LoginCodeProperty.CREATE_TIMESTAMP} INTEGER NOT NULL,
        ${LoginCodeProperty.USED} INTEGER NOT NULL DEFAULT 0,

        CONSTRAINT fkUser FOREIGN KEY ( ${LoginCodeProperty.USER_ID} ) REFERENCES ${USER_TABLE_NAME} ( ${UserProperty.ID} )
      )
    `;
    const TABLE_SINGER = `
      CREATE TABLE ${SINGER_TABLE_NAME} (
        ${SingerProperty.ID} TEXT PRIMARY KEY NOT NULL,
        ${SingerProperty.AVATAR} TEXT NOT NULL DEFAULT '',
        ${SingerProperty.NAME} TEXT NOT NULL,
        ${SingerProperty.ALIASES} TEXT NOT NULL DEFAULT '',
        ${SingerProperty.CREATE_USER_ID} TEXT NOT NULL,
        ${SingerProperty.CREATE_TIMESTAMP} INTEGER NOT NULL,

        CONSTRAINT fkUser FOREIGN KEY ( ${SingerProperty.CREATE_USER_ID} ) REFERENCES ${USER_TABLE_NAME} ( ${UserProperty.ID} )
      )
    `;
    const TABLE_SINGER_MODIFY_RECORD = `
      CREATE TABLE ${SINGER_MODIFY_RECORD_TABLE_NAME} (
        ${SingerModifyRecordProperty.ID} INTEGER PRIMARY KEY AUTOINCREMENT,
        ${SingerModifyRecordProperty.SINGER_ID} TEXT NOT NULL,
        ${SingerModifyRecordProperty.MODIFY_USER_ID} TEXT NOT NULL,
        ${SingerModifyRecordProperty.KEY} TEXT NOT NULL,
        ${SingerModifyRecordProperty.MODIFY_TIMESTAMP} INTEGER NOT NULL,

        CONSTRAINT fkSinger FOREIGN KEY ( ${SingerModifyRecordProperty.SINGER_ID} ) REFERENCES singer ( ${SingerProperty.ID} ),
        CONSTRAINT fkUser FOREIGN KEY ( ${SingerModifyRecordProperty.MODIFY_USER_ID} ) REFERENCES user ( ${UserProperty.ID} )
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

        CONSTRAINT fkUser FOREIGN KEY ( ${MusicProperty.CREATE_USER_ID} ) REFERENCES ${USER_TABLE_NAME} ( ${UserProperty.ID} )
      )
    `;
    const TABLE_MUSIC_MODIGY_RECORD = `
      CREATE TABLE ${MUSIC_MODIFY_RECORD_TABLE_NAME} (
        ${MusicModifyRecordProperty.ID} INTEGER PRIMARY KEY AUTOINCREMENT,
        ${MusicModifyRecordProperty.MUSIC_ID} TEXT NOT NULL,
        ${MusicModifyRecordProperty.MODIFY_USER_ID} TEXT NOT NULL,
        ${MusicModifyRecordProperty.KEY} TEXT NOT NULL,
        ${MusicModifyRecordProperty.MODIFY_TIMESTAMP} INTEGER NOT NULL,

        CONSTRAINT fkMusic FOREIGN KEY ( ${MusicModifyRecordProperty.MUSIC_ID} ) REFERENCES ${MUSIC_TABLE_NAME} ( ${MusicProperty.ID} ),
        CONSTRAINT fkUser FOREIGN KEY ( ${MusicModifyRecordProperty.MODIFY_USER_ID} ) REFERENCES ${USER_TABLE_NAME} ( ${UserProperty.ID} )
      )
    `;
    const TABLE_MUSIC_FORK = `
      CREATE TABLE ${MUSIC_FORK_TABLE_NAME} (
        ${MusicForkProperty.ID} INTEGER PRIMARY KEY AUTOINCREMENT,
        ${MusicForkProperty.MUSIC_ID} TEXT NOT NULL,
        ${MusicForkProperty.FORK_FROM} TEXT NOT NULL,

        CONSTRAINT fkMusic FOREIGN KEY ( ${MusicForkProperty.MUSIC_ID} ) REFERENCES ${MUSIC_TABLE_NAME} ( ${MusicProperty.ID} ),
        CONSTRAINT fkForkFrom FOREIGN KEY ( ${MusicForkProperty.FORK_FROM} ) REFERENCES ${MUSIC_TABLE_NAME} ( ${MusicProperty.ID} ),
        UNIQUE( ${MusicForkProperty.MUSIC_ID}, ${MusicForkProperty.FORK_FROM} ) ON CONFLICT REPLACE
      )
    `;
    const TABLE_LYRIC = `
      CREATE TABLE ${LYRIC_TABLE_NAME} (
        ${LyricProperty.ID} INTEGER PRIMARY KEY AUTOINCREMENT,
        ${LyricProperty.MUSIC_ID} TEXT NOT NULL,
        ${LyricProperty.LRC} TEXT NOT NULL,
        ${LyricProperty.LRC_CONTENT} TEXT NOT NULL,

        CONSTRAINT fkMusic FOREIGN KEY ( ${LyricProperty.MUSIC_ID} ) REFERENCES ${MUSIC_TABLE_NAME} ( ${MusicProperty.ID} ) 
      )
    `;
    const TABLE_MUSIC_PLAY_RECORD = `
      CREATE TABLE ${MUSIC_PLAY_RECORD_TABLE_NAME} (
        ${MusicPlayRecordProperty.ID} INTEGER PRIMARY KEY AUTOINCREMENT,
        ${MusicPlayRecordProperty.USER_ID} TEXT NOT NULL,
        ${MusicPlayRecordProperty.MUSIC_ID} TEXT NOT NULL,
        ${MusicPlayRecordProperty.PERCENT} REAL NOT NULL,
        ${MusicPlayRecordProperty.TIMESTAMP} INTEGER NOT NULL,

        CONSTRAINT fkUser FOREIGN KEY ( ${MusicPlayRecordProperty.USER_ID} ) REFERENCES ${USER_TABLE_NAME} ( ${UserProperty.ID} ),
        CONSTRAINT fkMusic FOREIGN KEY ( ${MusicPlayRecordProperty.MUSIC_ID} ) REFERENCES ${MUSIC_TABLE_NAME} ( ${MusicProperty.ID} ) 
      )
    `;
    const TABLE_MUSIC_SINGER_RELATION = `
      CREATE TABLE ${MUSIC_SINGER_RELATION_TABLE_NAME} (
        ${MusicSingerRelationProperty.ID} INTEGER PRIMARY KEY AUTOINCREMENT,
        ${MusicSingerRelationProperty.MUSIC_ID} TEXT NOT NULL,
        ${MusicSingerRelationProperty.SINGER_ID} TEXT NOT NULL,

        CONSTRAINT fkMusic FOREIGN KEY ( ${MusicSingerRelationProperty.MUSIC_ID} ) REFERENCES ${MUSIC_TABLE_NAME} ( ${MusicProperty.ID} ),
        CONSTRAINT fkSinger FOREIGN KEY ( ${MusicSingerRelationProperty.SINGER_ID} ) REFERENCES ${SINGER_TABLE_NAME} ( ${SingerProperty.ID} ),
        UNIQUE( ${MusicSingerRelationProperty.MUSIC_ID}, ${MusicSingerRelationProperty.SINGER_ID} ) ON CONFLICT REPLACE
      )
    `;
    const TABLE_MUSICBILL = `
      CREATE TABLE ${MUSICBILL_TABLE_NAME} (
        ${MusicbillProperty.ID} TEXT PRIMARY KEY NOT NULL,
        ${MusicbillProperty.USER_ID} TEXT NOT NULL,
        ${MusicbillProperty.COVER} TEXT NOT NULL DEFAULT '',
        ${MusicbillProperty.NAME} TEXT NOT NULL,
        ${MusicbillProperty.PUBLIC} INTEGER NOT NULL DEFAULT 0,
        ${MusicbillProperty.CREATE_TIMESTAMP} INTEGER NOT NULL,

        CONSTRAINT fkUser FOREIGN KEY ( ${MusicbillProperty.USER_ID} ) REFERENCES ${USER_TABLE_NAME} ( ${UserProperty.ID} ) 
      )
    `;
    const TABLE_MUSICBILL_MUSIC = `
      CREATE TABLE ${MUSICBILL_MUSIC_TABLE_NAME} (
        ${MusicbillMusicProperty.ID} INTEGER PRIMARY KEY AUTOINCREMENT,
        ${MusicbillMusicProperty.MUSICBILL_ID} TEXT NOT NULL,
        ${MusicbillMusicProperty.MUSIC_ID} TEXT NOT NULL,
        ${MusicbillMusicProperty.ADD_TIMESTAMP} INTEGER NOT NULL,

        CONSTRAINT fkMusicbill FOREIGN KEY ( ${MusicbillMusicProperty.MUSICBILL_ID} ) REFERENCES ${MUSICBILL_TABLE_NAME} ( ${MusicbillProperty.ID} ),
        CONSTRAINT fkMusic FOREIGN KEY ( ${MusicbillMusicProperty.MUSIC_ID} ) REFERENCES ${MUSIC_TABLE_NAME} ( ${MusicProperty.ID} ),
        UNIQUE( ${MusicbillMusicProperty.MUSICBILL_ID}, ${MusicbillMusicProperty.MUSIC_ID} ) ON CONFLICT REPLACE
      )
    `;
    const TABLE_MUSICBILL_COLLECTION = `
      CREATE TABLE ${MUSICBILL_COLLECTION_TABLE_NAME} (
        ${MusicbillCollectionProperty.ID} INTEGER PRIMARY KEY AUTOINCREMENT,
        ${MusicbillCollectionProperty.MUSICBILL_ID} TEXT NOT NULL,
        ${MusicbillCollectionProperty.USER_ID} TEXT NOT NULL,
        ${MusicbillCollectionProperty.COLLECT_TIMESTAMP} INTEGER NOT NULL,

        CONSTRAINT fkMusicbill FOREIGN KEY ( ${MusicbillCollectionProperty.MUSICBILL_ID} ) REFERENCES ${MUSICBILL_TABLE_NAME} ( ${MusicbillProperty.ID} ),
        CONSTRAINT fkUser FOREIGN KEY ( ${MusicbillCollectionProperty.USER_ID} ) REFERENCES ${USER_TABLE_NAME} ( ${UserProperty.ID} ),
        UNIQUE( ${MusicbillCollectionProperty.MUSICBILL_ID}, ${MusicbillCollectionProperty.USER_ID} ) ON CONFLICT REPLACE
      )
    `;
    const TABLE_MUSICBILL_EXPORT = `
      CREATE TABLE ${MUSICBILL_EXPORT_TABLE_NAME} (
        ${MusicbillExportProperty.ID} INTEGER PRIMARY KEY AUTOINCREMENT,
        ${MusicbillExportProperty.USER_ID} TEXT NOT NULL,
        ${MusicbillExportProperty.MUSICBILL_ID} TEXT NOT NULL,
        ${MusicbillExportProperty.ACCESS_ORIGIN} TEXT NOT NULL,
        ${MusicbillExportProperty.CREATE_TIMESTAMP} INTEGER NOT NULL,
        ${MusicbillExportProperty.EXPORTED_TIMESTAMP} INTEGER DEFAULT NULL,

        CONSTRAINT fkUser FOREIGN KEY ( ${MusicbillExportProperty.USER_ID} ) REFERENCES ${USER_TABLE_NAME} ( ${UserProperty.ID} ),
        CONSTRAINT fkMusicbill FOREIGN KEY ( ${MusicbillExportProperty.MUSICBILL_ID} ) REFERENCES ${MUSICBILL_TABLE_NAME} ( ${MusicbillProperty.ID} ) 
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
        console.log(`❌ [ ${adminEmail} ] 不是合法的邮箱`);
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
    console.log(`🎉 现在你可以使用 [ ${adminEmail} ] 登录了`);
  }
};
