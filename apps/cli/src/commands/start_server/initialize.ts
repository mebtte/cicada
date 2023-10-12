import fs from 'fs';
import { AssetType } from '#/constants';
import {
  MusicProperty,
  MUSIC_TABLE_NAME,
  SingerProperty,
  SINGER_TABLE_NAME,
  UserProperty,
  USER_TABLE_NAME,
  CAPTCHA_TABLE_NAME,
  CaptchaProperty,
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
  PUBLIC_MUSICBILL_COLLECTION_TABLE_NAME,
  PublicMusicbillCollectionProperty,
  SHARED_MUSICBILL_TABLE_NAME,
  SharedMusicbillProperty,
  User,
} from '@/constants/db_definition';
import DB from '@/utils/db';
import {
  getAssetDirectory,
  getConfig,
  getDBFilePath,
  getLogDirectory,
  getTrashDirectory,
  getCacheDirectory,
  getDataVersionPath,
} from '@/config';
import exitWithMessage from '@/utils/exit_with_message';
import { FIRST_USER_ID } from '@/constants';
import md5 from 'md5';

const DATA_VERSION = 2;

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
    getTrashDirectory(),
    getLogDirectory(),
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
          `\nCurrent version of data is v${dataVersion}, please start server after using cicada.v${
            dataVersion + 1
          } to upgrade data by [ cicada upgrade-data <data> ]\n`,
        );
      }
      return exitWithMessage('Please upgrade your cicada to latest');
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
        ${UserProperty.USERNAME} TEXT UNIQUE NOT NULL,
        ${UserProperty.AVATAR} TEXT NOT NULL DEFAULT '',
        ${UserProperty.NICKNAME} TEXT NOT NULL,
        ${UserProperty.JOIN_TIMESTAMP} INTEGER NOT NULL,
        ${UserProperty.ADMIN} INTEGER NOT NULL DEFAULT 0,
        ${UserProperty.REMARK} TEXT NOT NULL DEFAULT '',
        ${UserProperty.MUSICBILL_ORDERS_JSON} TEXT DEFAULT NULL,
        ${UserProperty.MUSICBILL_MAX_AMOUNT} INTEGER NOT NULL DEFAULT 100,
        ${UserProperty.CREATE_MUSIC_MAX_AMOUNT_PER_DAY} INTEGER NOT NULL DEFAULT 10,
        ${UserProperty.LAST_ACTIVE_TIMESTAMP} INTEGER NOT NULL DEFAULT 0,
        ${UserProperty.MUSIC_PLAY_RECORD_INDATE} INTEGER NOT NULL DEFAULT 0,
        ${UserProperty.PASSWORD} TEXT NOT NULL,
        ${UserProperty.TOKEN_IDENTIFIER} TEXT NOT NULL DEFAULT '',
        ${UserProperty.TWO_FA_SECRET} TEXT DEFAULT NULL
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
    const TABLE_SINGER = `
      CREATE TABLE ${SINGER_TABLE_NAME} (
        ${SingerProperty.ID} TEXT PRIMARY KEY NOT NULL,
        ${SingerProperty.AVATAR} TEXT NOT NULL DEFAULT '',
        ${SingerProperty.NAME} TEXT NOT NULL,
        ${SingerProperty.ALIASES} TEXT NOT NULL DEFAULT '',
        ${SingerProperty.CREATE_USER_ID} TEXT NOT NULL REFERENCES ${USER_TABLE_NAME} ( ${UserProperty.ID} ),
        ${SingerProperty.CREATE_TIMESTAMP} INTEGER NOT NULL
      )
    `;
    const TABLE_SINGER_MODIFY_RECORD = `
      CREATE TABLE ${SINGER_MODIFY_RECORD_TABLE_NAME} (
        ${SingerModifyRecordProperty.ID} INTEGER PRIMARY KEY AUTOINCREMENT,
        ${SingerModifyRecordProperty.SINGER_ID} TEXT NOT NULL REFERENCES ${SINGER_TABLE_NAME} ( ${SingerProperty.ID} ),
        ${SingerModifyRecordProperty.MODIFY_USER_ID} TEXT NOT NULL REFERENCES ${USER_TABLE_NAME} ( ${UserProperty.ID} ),
        ${SingerModifyRecordProperty.KEY} TEXT NOT NULL,
        ${SingerModifyRecordProperty.MODIFY_TIMESTAMP} INTEGER NOT NULL
      )
    `;
    const TABLE_MUSIC = `
      CREATE TABLE ${MUSIC_TABLE_NAME} (
        ${MusicProperty.ID} TEXT PRIMARY KEY NOT NULL,
        ${MusicProperty.TYPE} INTEGER NOT NULL,
        ${MusicProperty.NAME} TEXT NOT NULL,
        ${MusicProperty.YEAR} INTEGER DEFAULT NULL,
        ${MusicProperty.ALIASES} TEXT NOT NULL DEFAULT '',
        ${MusicProperty.COVER} TEXT NOT NULL DEFAULT '',
        ${MusicProperty.ASSET} TEXT NOT NULL,
        ${MusicProperty.HEAT} INTEGER NOT NULL DEFAULT 0,
        ${MusicProperty.CREATE_USER_ID} TEXT NOT NULL REFERENCES ${USER_TABLE_NAME} ( ${UserProperty.ID} ),
        ${MusicProperty.CREATE_TIMESTAMP} INTEGER NOT NULL
      )
    `;
    const TABLE_MUSIC_MODIGY_RECORD = `
      CREATE TABLE ${MUSIC_MODIFY_RECORD_TABLE_NAME} (
        ${MusicModifyRecordProperty.ID} INTEGER PRIMARY KEY AUTOINCREMENT,
        ${MusicModifyRecordProperty.MUSIC_ID} TEXT NOT NULL REFERENCES ${MUSIC_TABLE_NAME} ( ${MusicProperty.ID} ),
        ${MusicModifyRecordProperty.MODIFY_USER_ID} TEXT NOT NULL REFERENCES ${USER_TABLE_NAME} ( ${UserProperty.ID} ),
        ${MusicModifyRecordProperty.KEY} TEXT NOT NULL,
        ${MusicModifyRecordProperty.MODIFY_TIMESTAMP} INTEGER NOT NULL
      )
    `;
    const TABLE_MUSIC_FORK = `
      CREATE TABLE ${MUSIC_FORK_TABLE_NAME} (
        ${MusicForkProperty.ID} INTEGER PRIMARY KEY AUTOINCREMENT,
        ${MusicForkProperty.MUSIC_ID} TEXT NOT NULL REFERENCES ${MUSIC_TABLE_NAME} ( ${MusicProperty.ID} ),
        ${MusicForkProperty.FORK_FROM} TEXT NOT NULL REFERENCES ${MUSIC_TABLE_NAME} ( ${MusicProperty.ID} ),

        UNIQUE( ${MusicForkProperty.MUSIC_ID}, ${MusicForkProperty.FORK_FROM} ) ON CONFLICT REPLACE
      )
    `;
    const TABLE_LYRIC = `
      CREATE TABLE ${LYRIC_TABLE_NAME} (
        ${LyricProperty.ID} INTEGER PRIMARY KEY AUTOINCREMENT,
        ${LyricProperty.MUSIC_ID} TEXT NOT NULL REFERENCES ${MUSIC_TABLE_NAME} ( ${MusicProperty.ID} ),
        ${LyricProperty.LRC} TEXT NOT NULL,
        ${LyricProperty.LRC_CONTENT} TEXT NOT NULL 
      )
    `;
    const TABLE_MUSIC_PLAY_RECORD = `
      CREATE TABLE ${MUSIC_PLAY_RECORD_TABLE_NAME} (
        ${MusicPlayRecordProperty.ID} INTEGER PRIMARY KEY AUTOINCREMENT,
        ${MusicPlayRecordProperty.USER_ID} TEXT NOT NULL REFERENCES ${USER_TABLE_NAME} ( ${UserProperty.ID} ),
        ${MusicPlayRecordProperty.MUSIC_ID} TEXT NOT NULL REFERENCES ${MUSIC_TABLE_NAME} ( ${MusicProperty.ID} ),
        ${MusicPlayRecordProperty.PERCENT} REAL NOT NULL,
        ${MusicPlayRecordProperty.TIMESTAMP} INTEGER NOT NULL 
      )
    `;
    const TABLE_MUSIC_SINGER_RELATION = `
      CREATE TABLE ${MUSIC_SINGER_RELATION_TABLE_NAME} (
        ${MusicSingerRelationProperty.ID} INTEGER PRIMARY KEY AUTOINCREMENT,
        ${MusicSingerRelationProperty.MUSIC_ID} TEXT NOT NULL REFERENCES ${MUSIC_TABLE_NAME} ( ${MusicProperty.ID} ),
        ${MusicSingerRelationProperty.SINGER_ID} TEXT NOT NULL REFERENCES ${SINGER_TABLE_NAME} ( ${SingerProperty.ID} ),

        UNIQUE( ${MusicSingerRelationProperty.MUSIC_ID}, ${MusicSingerRelationProperty.SINGER_ID} ) ON CONFLICT REPLACE
      )
    `;
    const TABLE_MUSICBILL = `
      CREATE TABLE ${MUSICBILL_TABLE_NAME} (
        ${MusicbillProperty.ID} TEXT PRIMARY KEY NOT NULL,
        ${MusicbillProperty.USER_ID} TEXT NOT NULL REFERENCES ${USER_TABLE_NAME} ( ${UserProperty.ID} ),
        ${MusicbillProperty.COVER} TEXT NOT NULL DEFAULT '',
        ${MusicbillProperty.NAME} TEXT NOT NULL,
        ${MusicbillProperty.PUBLIC} INTEGER NOT NULL DEFAULT 0,
        ${MusicbillProperty.CREATE_TIMESTAMP} INTEGER NOT NULL 
      )
    `;
    const TABLE_MUSICBILL_MUSIC = `
      CREATE TABLE ${MUSICBILL_MUSIC_TABLE_NAME} (
        ${MusicbillMusicProperty.ID} INTEGER PRIMARY KEY AUTOINCREMENT,
        ${MusicbillMusicProperty.MUSICBILL_ID} TEXT NOT NULL REFERENCES ${MUSICBILL_TABLE_NAME} ( ${MusicbillProperty.ID} ),
        ${MusicbillMusicProperty.MUSIC_ID} TEXT NOT NULL REFERENCES ${MUSIC_TABLE_NAME} ( ${MusicProperty.ID} ),
        ${MusicbillMusicProperty.ADD_TIMESTAMP} INTEGER NOT NULL,

        UNIQUE( ${MusicbillMusicProperty.MUSICBILL_ID}, ${MusicbillMusicProperty.MUSIC_ID} ) ON CONFLICT REPLACE
      )
    `;
    const TABLE_MUSICBILL_COLLECTION = `
      CREATE TABLE ${PUBLIC_MUSICBILL_COLLECTION_TABLE_NAME} (
        ${PublicMusicbillCollectionProperty.ID} INTEGER PRIMARY KEY AUTOINCREMENT,
        ${PublicMusicbillCollectionProperty.MUSICBILL_ID} TEXT NOT NULL REFERENCES ${MUSICBILL_TABLE_NAME} ( ${MusicbillProperty.ID} ),
        ${PublicMusicbillCollectionProperty.USER_ID} TEXT NOT NULL REFERENCES ${USER_TABLE_NAME} ( ${UserProperty.ID} ),
        ${PublicMusicbillCollectionProperty.COLLECT_TIMESTAMP} INTEGER NOT NULL,

        UNIQUE( ${PublicMusicbillCollectionProperty.MUSICBILL_ID}, ${PublicMusicbillCollectionProperty.USER_ID} ) ON CONFLICT REPLACE
      )
    `;
    const TABLE_SHARED_MUSICBILL = `
      CREATE TABLE ${SHARED_MUSICBILL_TABLE_NAME} (
        ${SharedMusicbillProperty.ID} INTEGER PRIMARY KEY AUTOINCREMENT,
        ${SharedMusicbillProperty.MUSICBILL_ID} TEXT NOT NULL REFERENCES ${MUSICBILL_TABLE_NAME} ( ${MusicbillProperty.ID} ),
        ${SharedMusicbillProperty.SHARED_USER_ID} TEXT NOT NULL REFERENCES ${USER_TABLE_NAME} ( ${UserProperty.ID} ),
        ${SharedMusicbillProperty.INVITE_USER_ID} TEXT NOT NULL REFERENCES ${USER_TABLE_NAME} ( ${UserProperty.ID} ),
        ${SharedMusicbillProperty.INVITE_TIMESTAMP} INTEGER NOT NULL,
        ${SharedMusicbillProperty.ACCEPTED} INTEGER NOT NULL DEFAULT 0,

        UNIQUE( ${SharedMusicbillProperty.MUSICBILL_ID}, ${SharedMusicbillProperty.SHARED_USER_ID} ) ON CONFLICT REPLACE
      )
    `;

    /** 注意表创建顺序 */
    const TABLES = [
      TABLE_USER,
      TABLE_CAPTCHA,
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
      TABLE_SHARED_MUSICBILL,
    ];
    for (const table of TABLES) {
      await db.run(table);
    }
  }

  const db = new DB(getDBFilePath());
  const admin = await db.get<Pick<User, UserProperty.ID>>(
    `
      SELECT ${UserProperty.ID} FROM ${USER_TABLE_NAME}
      WHERE ${UserProperty.ADMIN} = 1
    `,
  );
  if (!admin) {
    const username = 'cicada';
    const password = 'cicada';
    await db.run(
      `
        INSERT INTO ${USER_TABLE_NAME} ( ${UserProperty.ID}, ${UserProperty.USERNAME}, ${UserProperty.PASSWORD}, ${UserProperty.NICKNAME}, ${UserProperty.JOIN_TIMESTAMP}, ${UserProperty.ADMIN} )
        VALUES ( ?, ?, ?, ?, ?, 1 )
      `,
      [FIRST_USER_ID, username, md5(md5(password)), 'Cicada', Date.now()],
    );

    // eslint-disable-next-line no-console
    console.log(
      `\n--- You can use [ ${username}/${password} ] to login now ---\n`,
    );
  }
};
