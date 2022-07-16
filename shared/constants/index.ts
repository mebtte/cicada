export const BRAND_NAME = '知了';

/** 图形验证码有效期 */
export const CAPTCHA_TTL = 1000 * 60 * 1;

/** 获取登录验证码间隔 */
export const GET_LOGIN_CODE_INTERVAL = 1000 * 60 * 2;

export const DB_FILENAME = 'db';
export const TRASH_FILENAME = 'trash';

export enum AssetType {
  USER_AVATAR = 'user_avatar',
  MUSICBILL_COVER = 'musicbill_cover',
  SINGER_AVATAR = 'singer_avatar',
  MUSIC_COVER = 'music_cover',
  MUSIC_SQ = 'music_sq',
  MUSIC_HQ = 'music_hq',
  MUSIC_AC = 'music_ac',
}
export const ASSET_TYPES = Object.values(AssetType);
export const ASSET_TYPE_MAP: Record<
  AssetType,
  {
    acceptTypes: string[];
    maxSize: number;
  }
> = {
  [AssetType.SINGER_AVATAR]: {
    acceptTypes: ['image/jpeg'],
    maxSize: 1024 * 1024 * 0.3,
  },
  [AssetType.MUSICBILL_COVER]: {
    acceptTypes: ['image/jpeg'],
    maxSize: 1024 * 1024 * 0.3,
  },
  [AssetType.MUSIC_COVER]: {
    acceptTypes: ['image/jpeg'],
    maxSize: 1024 * 1024 * 0.3,
  },
  [AssetType.USER_AVATAR]: {
    acceptTypes: ['image/jpeg'],
    maxSize: 1024 * 1024 * 0.3,
  },
  [AssetType.MUSIC_SQ]: {
    acceptTypes: ['audio/mpeg', 'audio/x-m4a', 'audio/mp4', 'video/mp4'],
    maxSize: 1024 * 1024 * 10,
  },
  [AssetType.MUSIC_AC]: {
    acceptTypes: ['audio/mpeg', 'audio/x-m4a', 'audio/mp4', 'video/mp4'],
    maxSize: 1024 * 1024 * 10,
  },
  [AssetType.MUSIC_HQ]: {
    acceptTypes: ['audio/x-flac'],
    maxSize: 1024 * 1024 * 50,
  },
};

export const EFFECTIVE_PLAY_PERCENT = 0.75;

export const ALIAS_DIVIDER = '|';

export const MUSICBILL_EXPORT_TTL = 1000 * 60 * 60 * 24;
