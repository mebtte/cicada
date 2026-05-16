export enum AssetType {
  USER_AVATAR = 'user_avatar',
  MUSICBILL_COVER = 'musicbill_cover',
  SINGER_PHOTO = 'singer_photo',
  MUSIC_COVER = 'music_cover',
  MUSIC = 'music',
}
export const ASSET_TYPES = Object.values(AssetType);
export const MUSIC_ASSET_ACCEPT_TYPES: string[] = [
  'audio/*',
  '.mp3',
  'audio/mpeg',
  'audio/mp3',
  'audio/x-mpeg',
];
export const ASSET_TYPE_MAP: Record<
  AssetType,
  {
    acceptType: Record<string, string[]>;
    maxSize: number;
  }
> = {
  [AssetType.SINGER_PHOTO]: {
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
    acceptType: {},
    maxSize: 1024 * 1024 * 200,
  },
};

export const IMAGE_MAX_SIZE = 2048;
