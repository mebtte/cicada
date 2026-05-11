function getURLBase() {
  return typeof globalThis.location === 'undefined'
    ? 'http://localhost'
    : globalThis.location.origin;
}

function createMusicAssetURL(asset: string) {
  return new URL(asset, getURLBase());
}

export function getMusicAssetOriginalExtension(asset: string) {
  const url = createMusicAssetURL(asset);
  const filename = url.pathname.split('/').at(-1) || '';
  const ext = filename.includes('.') ? filename.split('.').at(-1) : '';
  return ext || 'audio';
}

export function getSmoothMusicAsset(asset: string) {
  const url = createMusicAssetURL(asset);
  url.searchParams.delete('codec');
  url.searchParams.delete('bitrate');
  url.searchParams.set('codec', 'aac');
  url.searchParams.set('bitrate', '192');
  return url.href;
}

export function getSourceBitrateMusicAsset(asset: string) {
  const url = createMusicAssetURL(asset);
  url.searchParams.delete('codec');
  url.searchParams.delete('bitrate');
  url.searchParams.set('codec', 'flac');
  return url.href;
}
