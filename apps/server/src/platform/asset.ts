import { AssetType } from '#/constants';
import argv from '@/argv';
import { ASSET_DIR } from '@/constants/directory';
import { ASSET_PREFIX } from '../constants';

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
  return `${argv.publicAddress}/${ASSET_PREFIX}/${assetType}/${asset}`;
}
