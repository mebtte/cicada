import { AssetType, PathPrefix } from '#/constants';
import config from '@/config';
import { ASSET_DIR } from '@/constants/directory';

export function getAssetPath(asset: string, assetType: AssetType) {
  if (!asset.length) {
    return '';
  }
  return `${ASSET_DIR[assetType]}/${asset}`;
}

export function getAssetUrl(asset: string, assetType: AssetType) {
  if (!asset.length) {
    return '';
  }
  return `${config.publicAddress}/${PathPrefix.ASSET}/${assetType}/${asset}`;
}
