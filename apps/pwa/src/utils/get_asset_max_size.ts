import { AssetType } from '@/constants/asset';
import { getSelectedServer, useServer } from '@/global_states/server';

/**
 * Returns the byte size cap for the given asset type.
 *
 * Source of truth is the server-side config exposed via /base/metadata. When
 * metadata has not arrived yet, callers should skip client-side size checks
 * and let the API return the final error.
 *
 * Music assets carry either audio or video payloads, so the resolved cap
 * depends on the file's MIME. Pass `mime` whenever it is known (eg. `File.type`)
 * for an accurate pre-check; without it the function returns
 * `max(audio, video)` so the cap stays permissive enough that legitimate
 * uploads do not get blocked locally.
 */
function getAssetMaxSize(
  assetType: AssetType,
  mime?: string,
): number | undefined {
  const server = getSelectedServer(useServer.getState());
  if (!server) {
    return undefined;
  }

  if (assetType !== AssetType.MUSIC) {
    return server.imageFileMaxSize;
  }

  const audio = server.audioFileMaxSize;
  const video = server.videoFileMaxSize;

  if (mime) {
    if (mime.startsWith('audio/')) return audio;
    if (mime.startsWith('video/')) return video;
  }

  if (audio == null) return video;
  if (video == null) return audio;
  return Math.max(audio, video);
}

export default getAssetMaxSize;
