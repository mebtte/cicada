import { AssetTypeV0, AssetTypeV1, PathPrefix } from '#/constants';
import { getAssetDirectory } from '@/config';

export function getAssetFilePath(
  asset: string,
  assetType: AssetTypeV0 | AssetTypeV1,
) {
  if (!asset.length) {
    return '';
  }
  return `${getAssetDirectory(assetType)}/${asset}`;
}

export function getAssetPublicPath(
  asset: string,
  assetType: AssetTypeV0 | AssetTypeV1,
) {
  if (!asset.length) {
    return '';
  }
  return `/${PathPrefix.ASSET}/${assetType}/${asset}`;
}
