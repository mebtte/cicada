import { AssetTypeV1, PathPrefix } from '#/constants';
import { getAssetDirectory } from '@/config';

export function getAssetFilePathV1(asset: string, assetType: AssetTypeV1) {
  if (!asset.length) {
    return '';
  }
  return `${getAssetDirectory(assetType)}/${asset}`;
}

export function getAssetPublicPathV1(asset: string, assetType: AssetTypeV1) {
  if (!asset.length) {
    return '';
  }
  return `/${PathPrefix.ASSET}/${assetType}/${asset}`;
}
