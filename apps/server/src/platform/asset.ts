import argv from '@/argv';
import { ASSET_PREFIX } from '../constants';

export enum AssetType {
  USER_AVATAR = 'user_avatar',
  MUSICBILL_COVER = 'musicbill_cover',
  CHARACTER_AVATAR = 'character_avatar',
  MUSIC_COVER = 'music_cover',
  MUSIC_SQ = 'music_sq',
  MUSIC_HQ = 'music_hq',
  MUSIC_AC = 'music_ac',
}
export const ASSET_TYPE_MAP: Record<
  AssetType,
  {
    directoryName: string;
  }
> = {
  [AssetType.USER_AVATAR]: {
    directoryName: 'user_avatar',
  },
  [AssetType.MUSICBILL_COVER]: {
    directoryName: 'musicbill_cover',
  },
  [AssetType.CHARACTER_AVATAR]: {
    directoryName: 'character_avatar',
  },
  [AssetType.MUSIC_COVER]: {
    directoryName: 'music_cover',
  },
  [AssetType.MUSIC_SQ]: {
    directoryName: 'music_sq',
  },
  [AssetType.MUSIC_HQ]: {
    directoryName: 'music_hq',
  },
  [AssetType.MUSIC_AC]: {
    directoryName: 'music_ac',
  },
};

export function getAssetUrl(asset: string, assetType: AssetType) {
  if (!asset.length) {
    return '';
  }
  return `${argv.publicAddress}/${ASSET_PREFIX}/${ASSET_TYPE_MAP[assetType].directoryName}/${asset}`;
}
