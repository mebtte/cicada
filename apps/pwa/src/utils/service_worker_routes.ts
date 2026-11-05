import { AssetType } from '../constants/asset.js';

/** Match service-relative routes even when a remote server uses another prefix. */
export function getAssetType(pathname: string): AssetType | undefined {
  const match = /\/asset\/([^/]+)\/[^/]+$/.exec(pathname);
  const type = match?.[1] as AssetType | undefined;
  return type && Object.values(AssetType).includes(type) ? type : undefined;
}

export function isCommonAPIPath(pathname: string) {
  return /\/api\/common(?:\/|$)/.test(pathname);
}
