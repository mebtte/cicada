import { AssetType } from '@/constants/asset';
import { getSelectedServer, useServer } from '@/global_states/server';

/**
 * Returns the byte size cap for the given asset type.
 *
 * Source of truth is the server-side config exposed via /base/metadata. When
 * metadata has not arrived yet, callers should skip client-side size checks
 * and let the API return the final error.
 */
function getAssetMaxSize(assetType: AssetType): number | undefined {
  if (assetType !== AssetType.MUSIC) {
    return undefined;
  }
  return getSelectedServer(useServer.getState())?.musicFileMaxSize;
}

export default getAssetMaxSize;
