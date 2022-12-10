import { AssetType, PathPrefix } from '#/constants';
import { getAssetDirectory, getConfig } from '@/config';

export function getAssetFilePath(asset: string, assetType: AssetType) {
  if (!asset.length) {
    return '';
  }
  return `${getAssetDirectory(assetType)}/${asset}`;
}

export function getAssetPublicPath(asset: string, assetType: AssetType) {
  if (!asset.length) {
    return '';
  }
  const config = getConfig();
  return `${config.publicOrigin}/${PathPrefix.ASSET}/${assetType}/${asset}`;
}
