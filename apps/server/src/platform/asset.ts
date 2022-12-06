import { AssetType, PathPrefix } from '#/constants';
import config from '@/config';
import { ASSET_DIR } from '@/constants/directory';

export function getAssetFilePath(asset: string, assetType: AssetType) {
  if (!asset.length) {
    return '';
  }
  return `${ASSET_DIR[assetType]}/${asset}`;
}

export function getAssetPublicPath(asset: string, assetType: AssetType) {
  if (!asset.length) {
    return '';
  }
  const c = config.get();
  return `${c.publicOrigin}/${PathPrefix.ASSET}/${assetType}/${asset}`;
}
