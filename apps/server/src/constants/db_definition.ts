import { MusicType } from '#/constants/music';

export const CAPTCHA_TABLE_NAME = 'captcha';
export enum CaptchaProperty {
  ID = 'id',
  VALUE = 'value',
  CREATE_TIMESTAMP = 'createTimestamp',
  USED = 'used',
}
export type Captcha = {
  [CaptchaProperty.ID]: string;
  [CaptchaProperty.VALUE]: string;
  [CaptchaProperty.CREATE_TIMESTAMP]: number;
  [CaptchaProperty.USED]: 0 | 1;
};

export const USER_TABLE_NAME = 'user';
export enum UserProperty {
  ID = 'id',
  EMAIL = 'email',
  AVATAR = 'avatar',
  NICKNAME = 'nickname',
  JOIN_TIMESTAMP = 'joinTimestamp',
  ADMIN = 'admin',
  REMARK = 'remark',
  MUSICBILL_ORDERS_JSON = 'musicbillOrdersJSON',
  MUSICBILL_MAX_AMOUNT = 'musicbillMaxAmount',
  CREATE_MUSIC_MAX_AMOUNT_PER_DAY = 'createMusicMaxAmountPerDay',
  EXPORT_MUSICBILL_MAX_TIME_PER_DAY = 'exportMusicbillMaxTimePerDay',
  LAST_ACTIVE_TIMESTAMP = 'lastActiveTimestamp',
  MUSIC_PLAY_RECORD_INDATE = 'musicPlayRecordIndate',
}
export type User = {
  [UserProperty.ID]: string;
  [UserProperty.EMAIL]: string;
  [UserProperty.AVATAR]: string;
  [UserProperty.NICKNAME]: string;
  [UserProperty.JOIN_TIMESTAMP]: number;
  [UserProperty.ADMIN]: 0 | 1;
  [UserProperty.REMARK]: string;
  [UserProperty.MUSICBILL_ORDERS_JSON]: string | null;
  [UserProperty.MUSICBILL_MAX_AMOUNT]: number;
  [UserProperty.CREATE_MUSIC_MAX_AMOUNT_PER_DAY]: number;
  [UserProperty.EXPORT_MUSICBILL_MAX_TIME_PER_DAY]: number;
  [UserProperty.LAST_ACTIVE_TIMESTAMP]: number;
  [UserProperty.MUSIC_PLAY_RECORD_INDATE]: number;
};

export const LOGIN_CODE_TABLE_NAME = 'login_code';
export enum LoginCodeProperty {
  ID = 'id',
  USER_ID = 'userId',
  CODE = 'code',
  CREATE_TIMESTAMP = 'createTimestamp',
  USED = 'used',
}
export type LoginCode = {
  [LoginCodeProperty.ID]: number;
  [LoginCodeProperty.USER_ID]: string;
  [LoginCodeProperty.CODE]: string;
  [LoginCodeProperty.CREATE_TIMESTAMP]: number;
  [LoginCodeProperty.USED]: 0 | 1;
};

export const MUSIC_TABLE_NAME = 'music';
export enum MusicProperty {
  ID = 'id',
  TYPE = 'type',
  NAME = 'name',
  ALIASES = 'aliases',
  COVER = 'cover',
  ASSET = 'asset',
  HEAT = 'heat',
  CREATE_USER_ID = 'createUserId',
  CREATE_TIMESTAMP = 'createTimestamp',
  YEAR = 'year',
}
export type Music = {
  [MusicProperty.ID]: string;
  [MusicProperty.TYPE]: MusicType;
  [MusicProperty.NAME]: string;
  [MusicProperty.ALIASES]: string;
  [MusicProperty.COVER]: string;
  [MusicProperty.ASSET]: string;
  [MusicProperty.HEAT]: number;
  [MusicProperty.CREATE_USER_ID]: string;
  [MusicProperty.CREATE_TIMESTAMP]: number;
  [MusicProperty.YEAR]: number | null;
};

export const MUSIC_MODIFY_RECORD_TABLE_NAME = 'music_modify_record';
export enum MusicModifyRecordProperty {
  ID = 'id',
  MUSIC_ID = 'musicId',
  KEY = 'key',
  MODIFY_USER_ID = 'modifyUserId',
  MODIFY_TIMESTAMP = 'modifyTimestamp',
}
export type MusicModifyRecord = {
  [MusicModifyRecordProperty.ID]: number;
  [MusicModifyRecordProperty.MUSIC_ID]: string;
  [MusicModifyRecordProperty.KEY]: string;
  [MusicModifyRecordProperty.MODIFY_USER_ID]: string;
  [MusicModifyRecordProperty.MODIFY_TIMESTAMP]: number;
};

export const MUSIC_FORK_TABLE_NAME = 'music_fork';
export enum MusicForkProperty {
  ID = 'id',
  MUSIC_ID = 'musicId',
  FORK_FROM = 'forkFrom',
}
export type MusicFork = {
  [MusicForkProperty.ID]: number;
  [MusicForkProperty.MUSIC_ID]: string;
  [MusicForkProperty.FORK_FROM]: string;
};

export const MUSIC_PLAY_RECORD_TABLE_NAME = 'music_play_record';
export enum MusicPlayRecordProperty {
  ID = 'id',
  USER_ID = 'userId',
  MUSIC_ID = 'musicId',
  PERCENT = 'percent',
  TIMESTAMP = 'timestamp',
}
export interface MusicPlayRecord {
  [MusicPlayRecordProperty.ID]: string;
  [MusicPlayRecordProperty.USER_ID]: string;
  [MusicPlayRecordProperty.MUSIC_ID]: string;
  [MusicPlayRecordProperty.PERCENT]: number;
  [MusicPlayRecordProperty.TIMESTAMP]: number;
}

export const SINGER_TABLE_NAME = 'singer';
export enum SingerProperty {
  ID = 'id',
  AVATAR = 'avatar',
  NAME = 'name',
  ALIASES = 'aliases',
  CREATE_USER_ID = 'createUserId',
  CREATE_TIMESTAMP = 'createTimestamp',
}
export type Singer = {
  [SingerProperty.ID]: string;
  [SingerProperty.AVATAR]: string;
  [SingerProperty.NAME]: string;
  [SingerProperty.ALIASES]: string;
  [SingerProperty.CREATE_USER_ID]: string;
  [SingerProperty.CREATE_TIMESTAMP]: number;
};

export const SINGER_MODIFY_RECORD_TABLE_NAME = 'singer_modify_record';
export enum SingerModifyRecordProperty {
  ID = 'id',
  SINGER_ID = 'singerId',
  KEY = 'key',
  MODIFY_USER_ID = 'modifyUserId',
  MODIFY_TIMESTAMP = 'modifyTimestamp',
}
export type SingerModifyRecord = {
  [SingerModifyRecordProperty.ID]: number;
  [SingerModifyRecordProperty.SINGER_ID]: string;
  [SingerModifyRecordProperty.KEY]: string;
  [SingerModifyRecordProperty.MODIFY_USER_ID]: string;
  [SingerModifyRecordProperty.MODIFY_TIMESTAMP]: number;
};

export const MUSIC_SINGER_RELATION_TABLE_NAME = 'music_singer_relation';
export enum MusicSingerRelationProperty {
  ID = 'id',
  MUSIC_ID = 'musicId',
  SINGER_ID = 'singerId',
}
export type MusicSingerRelation = {
  [MusicSingerRelationProperty.ID]: number;
  [MusicSingerRelationProperty.MUSIC_ID]: string;
  [MusicSingerRelationProperty.SINGER_ID]: string;
};

export const LYRIC_TABLE_NAME = 'lyric';
export enum LyricProperty {
  ID = 'id',
  MUSIC_ID = 'musicId',
  LRC = 'lrc',
  LRC_CONTENT = 'lrcContent',
}
export type Lyric = {
  [LyricProperty.ID]: number;
  [LyricProperty.MUSIC_ID]: string;
  [LyricProperty.LRC]: string;
  [LyricProperty.LRC_CONTENT]: string;
};

export const MUSICBILL_TABLE_NAME = 'musicbill';
export enum MusicbillProperty {
  ID = 'id',
  USER_ID = 'userId',
  COVER = 'cover',
  NAME = 'name',
  PUBLIC = 'public',
  CREATE_TIMESTAMP = 'createTimestamp',
}
export interface Musicbill {
  [MusicbillProperty.ID]: string;
  [MusicbillProperty.USER_ID]: string;
  [MusicbillProperty.COVER]: string;
  [MusicbillProperty.NAME]: string;
  [MusicbillProperty.PUBLIC]: 0 | 1;
  [MusicbillProperty.CREATE_TIMESTAMP]: number;
}
