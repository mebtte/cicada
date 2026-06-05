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
  }
> = {
  [AssetType.SINGER_PHOTO]: {
    acceptType: {
      jpg: ['image/jpeg'],
      jpeg: ['image/jpeg'],
    },
  },
  [AssetType.MUSICBILL_COVER]: {
    acceptType: {
      jpg: ['image/jpeg'],
      jpeg: ['image/jpeg'],
    },
  },
  [AssetType.MUSIC_COVER]: {
    acceptType: {
      jpg: ['image/jpeg'],
      jpeg: ['image/jpeg'],
    },
  },
  [AssetType.USER_AVATAR]: {
    acceptType: {
      jpg: ['image/jpeg'],
      jpeg: ['image/jpeg'],
    },
  },
  [AssetType.MUSIC]: {
    acceptType: {},
  },
};

export const IMAGE_MAX_SIZE = 2048;
