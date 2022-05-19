import config from '#/config';

const ASSET_DIR = `${config.serverBase}/assets`;

enum AssetType {
  CHARACTER_AVATAR = 'character_avatar',
  MUSIC_SQ = 'music_sq',
  MUSIC_AC = 'music_ac',
  MUSIC_HQ = 'music_hq',
  MUSIC_COVER = 'music_cover',
  MUSICBILL_COVER = 'musicbill_cover',
  USER_AVATAR = 'user_avatar',
}

const ASSET_TYPE_MAP: Record<
  AssetType,
  { directory: string; relativePath: string }
> = {
  [AssetType.CHARACTER_AVATAR]: {
    directory: `${ASSET_DIR}/character_avatar`,
    relativePath: '/character_avatar',
  },
  [AssetType.MUSIC_SQ]: {
    directory: `${ASSET_DIR}/music_sq`,
    relativePath: '/music_sq',
  },
  [AssetType.MUSIC_AC]: {
    directory: `${ASSET_DIR}/music_ac`,
    relativePath: '/music_ac',
  },
  [AssetType.MUSIC_HQ]: {
    directory: `${ASSET_DIR}/music_hq`,
    relativePath: '/music_hq',
  },
  [AssetType.MUSIC_COVER]: {
    directory: `${ASSET_DIR}/music_cover`,
    relativePath: '/music_cover',
  },
  [AssetType.MUSICBILL_COVER]: {
    directory: `${ASSET_DIR}/musicbill_cover`,
    relativePath: '/musicbill_cover',
  },
  [AssetType.USER_AVATAR]: {
    directory: `${ASSET_DIR}/user_avatar`,
    relativePath: '/user_avatar',
  },
};

function getAssetPublicUrl(asset: string, assetType: AssetType) {
  return asset
    ? `${config.serverAddress}/assets${ASSET_TYPE_MAP[assetType].relativePath}/${asset}`
    : '';
}

export default {
  ASSET_DIR,
  AssetType,
  ASSET_TYPE_MAP,
  getAssetPublicUrl,
};
