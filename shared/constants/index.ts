export const BRAND_NAME = '知了';

/** 图形验证码有效期 */
export const CAPTCHA_TTL = 1000 * 60 * 1;

/** 获取登录验证码间隔 */
export const GET_LOGIN_CODE_INTERVAL = 1000 * 60 * 2;

export enum PathPrefix {
  FORM = 'form',
  DOWNLOAD = 'download',
  ASSET = 'asset',
  API = 'api',
  BASE = 'base',
}

export enum AssetTypeV0 {
  USER_AVATAR = 'user_avatar',
  MUSICBILL_COVER = 'musicbill_cover',
  SINGER_AVATAR = 'singer_avatar',
  MUSIC_COVER = 'music_cover',
  MUSIC_SQ = 'music_sq',
  MUSIC_HQ = 'music_hq',
  MUSIC_AC = 'music_ac',
}
export const ASSET_TYPES_V0 = Object.values(AssetTypeV0);
export const ASSET_TYPE_MAP_V0: Record<
  AssetTypeV0,
  {
    acceptTypes: string[];
    maxSize: number;
  }
> = {
  [AssetTypeV0.SINGER_AVATAR]: {
    acceptTypes: ['image/jpeg'],
    maxSize: 1024 * 1024 * 0.5,
  },
  [AssetTypeV0.MUSICBILL_COVER]: {
    acceptTypes: ['image/jpeg'],
    maxSize: 1024 * 1024 * 0.5,
  },
  [AssetTypeV0.MUSIC_COVER]: {
    acceptTypes: ['image/jpeg'],
    maxSize: 1024 * 1024 * 0.5,
  },
  [AssetTypeV0.USER_AVATAR]: {
    acceptTypes: ['image/jpeg'],
    maxSize: 1024 * 1024 * 0.5,
  },
  [AssetTypeV0.MUSIC_SQ]: {
    acceptTypes: [
      'audio/wav',
      'audio/ogg',
      'audio/flac',
      'audio/x-flac',
      'audio/mpeg',
      'audio/m4a',
      'audio/x-m4a',
      'audio/mp4',
      'video/mp4',
    ],
    maxSize: 1024 * 1024 * 50,
  },
  [AssetTypeV0.MUSIC_AC]: {
    acceptTypes: [
      'audio/wav',
      'audio/ogg',
      'audio/flac',
      'audio/x-flac',
      'audio/mpeg',
      'audio/m4a',
      'audio/x-m4a',
      'audio/mp4',
      'video/mp4',
    ],
    maxSize: 1024 * 1024 * 50,
  },
  [AssetTypeV0.MUSIC_HQ]: {
    acceptTypes: ['audio/flac', 'audio/x-flac'],
    maxSize: 1024 * 1024 * 50,
  },
};

export enum AssetTypeV1 {
  USER_AVATAR = 'user_avatar',
  MUSICBILL_COVER = 'musicbill_cover',
  SINGER_AVATAR = 'singer_avatar',
  MUSIC_COVER = 'music_cover',
  MUSIC = 'music',
}
export const ASSET_TYPES_V1 = Object.values(AssetTypeV1);
export const ASSET_TYPE_MAP_V1: Record<
  AssetTypeV1,
  {
    acceptTypes: string[];
    maxSize: number;
  }
> = {
  [AssetTypeV1.SINGER_AVATAR]: {
    acceptTypes: ['image/jpeg'],
    maxSize: 1024 * 1024 * 1,
  },
  [AssetTypeV1.MUSICBILL_COVER]: {
    acceptTypes: ['image/jpeg'],
    maxSize: 1024 * 1024 * 1,
  },
  [AssetTypeV1.MUSIC_COVER]: {
    acceptTypes: ['image/jpeg'],
    maxSize: 1024 * 1024 * 1,
  },
  [AssetTypeV1.USER_AVATAR]: {
    acceptTypes: ['image/jpeg'],
    maxSize: 1024 * 1024 * 1,
  },
  [AssetTypeV1.MUSIC]: {
    acceptTypes: [
      'audio/wav',
      'audio/ogg',
      'audio/flac',
      'audio/x-flac',
      'audio/mpeg',
      'audio/m4a',
      'audio/x-m4a',
      'audio/mp4',
      'video/mp4',
    ],
    maxSize: 1024 * 1024 * 50,
  },
};

export const EFFECTIVE_PLAY_PERCENT = 0.75;

/**
 * 禁止修改分隔符
 * 否则数据库数据将异常
 * @author mebtte<hi@mebtte.com>
 */
export const ALIAS_DIVIDER = '♫';

export const DOWNLOAD_TTL = 1000 * 60 * 60 * 24 * 3;

export const COVER_MAX_SIZE = 1024;
