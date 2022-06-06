import argv from '@/argv';
import { ASSET_PREFIX } from '../constants';

export enum AssetType {
  USER_AVATAR = 'user_avatar',
  MUSICBILL_COVER = 'musicbill_cover',
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
};

export function getAssetUrl(asset: string, assetType: AssetType) {
  if (!asset.length) {
    return '';
  }
  return `${argv.publicAddress}/${ASSET_PREFIX}/${ASSET_TYPE_MAP[assetType].directoryName}/${asset}`;
}
