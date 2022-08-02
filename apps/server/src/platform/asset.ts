import { AssetType, PathPrefix } from '#/constants';
import argv from '@/argv';
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
  return `${argv.publicAddress}/${PathPrefix.ASSET}/${assetType}/${asset}`;
}
