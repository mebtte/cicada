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

export const IMAGE_MAX_SIZE = 2048;
