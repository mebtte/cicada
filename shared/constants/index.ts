/**
 * 图形验证码有效期
 * 前端有效期要比后端有效期短 10 秒
 * 减少接口处理时验证码已经过期的概率
 * @author mebtte<hi@mebtte.com>
 */
export const CAPTCHA_TTL = 1000 * 60 * 2;
export const CAPTCHA_TTL_FRONTEND = CAPTCHA_TTL - 100 * 10;

export enum PathPrefix {
  FORM = 'form',
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
export const ASSET_TYPES = Object.values(AssetType);
export const ASSET_TYPE_MAP: Record<
  AssetType,
  {
    acceptType: Record<string, string[]>;
    maxSize: number;
  }
> = {
  [AssetType.SINGER_AVATAR]: {
    acceptType: {
      jpg: ['image/jpeg'],
      jpeg: ['image/jpeg'],
    },
    maxSize: 1024 * 1024 * 2,
  },
  [AssetType.MUSICBILL_COVER]: {
    acceptType: {
      jpg: ['image/jpeg'],
      jpeg: ['image/jpeg'],
    },
    maxSize: 1024 * 1024 * 2,
  },
  [AssetType.MUSIC_COVER]: {
    acceptType: {
      jpg: ['image/jpeg'],
      jpeg: ['image/jpeg'],
    },
    maxSize: 1024 * 1024 * 2,
  },
  [AssetType.USER_AVATAR]: {
    acceptType: {
      jpg: ['image/jpeg'],
      jpeg: ['image/jpeg'],
    },
    maxSize: 1024 * 1024 * 2,
  },
  [AssetType.MUSIC]: {
    acceptType: {
      mp3: ['audio/mpeg'],
      flac: ['audio/flac', 'audio/x-flac'],
      m4a: ['audio/m4a', 'audio/x-m4a'],
      mp4: ['audio/mp4', 'video/mp4'],
    },
    maxSize: 1024 * 1024 * 200,
  },
};

/**
 * 有效播放百分比
 * @author mebtte<hi@mebtte.com>
 */
export const EFFECTIVE_PLAY_PERCENT = 0.75;

/**
 * 禁止修改分隔符
 * 否则数据库数据将异常
 * @author mebtte<hi@mebtte.com>
 */
export const ALIAS_DIVIDER = '♫';

/**
 * 图片最大尺寸
 * @author mebtte<hi@mebtte.com>
 */
export const IMAGE_MAX_SIZE = 2048;

/**
 * 共享乐单邀请最小存活时间
 * @author mebtte<hi@mebtte.com>
 */
export const SHARED_MUSICBILL_INVITATION_MINIMAL_TTL = 1000 * 60 * 60 * 24 * 3;

export const SINGER_MODIFY_RECORD_TTL = 1000 * 60 * 60 * 24 * 180;

export enum Language {
  ZH_HANS = 'zh-hans',
  EN_US = 'en-us',
  JA = 'ja',
}
export const LANGUAGES = Object.values(Language);
export const DEFAULT_LANGUAGE = Language.EN_US;

export enum CommonQuery {
  VERSION = '__v',
  LANGUAGE = '__lang',
}

export const BETA_VERSION_START = 'beta.';
