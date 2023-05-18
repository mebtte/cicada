export const BRAND_NAME = '知了';

/**
 * 图形验证码有效期
 * 前端有效期要比后端有效期短 10 秒
 * 减少接口处理时验证码已经过期的概率
 * @author mebtte<hi@mebtte.com>
 */
export const CAPTCHA_TTL = 1000 * 60 * 2;
export const CAPTCHA_TTL_FRONTEND = CAPTCHA_TTL - 100 * 10;

/** 获取登录验证码间隔 */
export const GET_LOGIN_CODE_INTERVAL = 1000 * 60 * 2;

export enum PathPrefix {
  FORM = 'form',
  DOWNLOAD = 'download',
  ASSET = 'asset',
  API = 'api',
  BASE = 'base',
}

export enum AssetType {
  USER_AVATAR = 'user_avatar',
  MUSICBILL_COVER = 'musicbill_cover',
  SINGER_AVATAR = 'singer_avatar',
  MUSIC_COVER = 'music_cover',
  MUSIC = 'music',
}
export const ASSET_TYPES_V1 = Object.values(AssetType);
export const ASSET_TYPE_MAP_V1: Record<
  AssetType,
  {
    acceptTypes: string[];
    maxSize: number;
  }
> = {
  [AssetType.SINGER_AVATAR]: {
    acceptTypes: ['image/jpeg'],
    maxSize: 1024 * 1024 * 1,
  },
  [AssetType.MUSICBILL_COVER]: {
    acceptTypes: ['image/jpeg'],
    maxSize: 1024 * 1024 * 1,
  },
  [AssetType.MUSIC_COVER]: {
    acceptTypes: ['image/jpeg'],
    maxSize: 1024 * 1024 * 1,
  },
  [AssetType.USER_AVATAR]: {
    acceptTypes: ['image/jpeg'],
    maxSize: 1024 * 1024 * 1,
  },
  [AssetType.MUSIC]: {
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
    maxSize: 1024 * 1024 * 200,
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
