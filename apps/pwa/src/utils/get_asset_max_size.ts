import { AssetType, ASSET_TYPE_MAP } from '@/constants/asset';
import { getSelectedServer, useServer } from '@/global_states/server';

/**
 * Returns the byte size cap for the given asset type.
 *
 * Source of truth is the server-side config exposed via /base/metadata. The
 * local ASSET_TYPE_MAP value is used only as a fallback when the metadata has
 * not arrived yet (first paint after a fresh storage state) so the UI never
 * crashes on a missing field.
 */
function getAssetMaxSize(assetType: AssetType): number {
  const server = getSelectedServer(useServer.getState());
  return (
    server?.assetMaxSize?.[assetType] ?? ASSET_TYPE_MAP[assetType].maxSize
  );
}

export default getAssetMaxSize;
