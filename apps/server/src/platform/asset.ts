import { AssetType, PathPrefix } from '#/constants';
import { getAssetDirectory } from '@/config';

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
  return `/${PathPrefix.ASSET}/${assetType}/${asset}`;
}
