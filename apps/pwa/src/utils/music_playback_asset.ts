import { MusicPlaybackQuality } from '@/constants/setting';

export default function getMusicPlaybackAsset({
  asset,
  quality,
}: {
  asset: string;
  quality: MusicPlaybackQuality;
}) {
  const url = new URL(asset, window.location.origin);
  url.searchParams.delete('codec');
  url.searchParams.delete('bitrate');

  switch (quality) {
    case MusicPlaybackQuality.SMOOTH: {
      url.searchParams.set('codec', 'aac');
      url.searchParams.set('bitrate', '192');
      break;
    }
    case MusicPlaybackQuality.SOURCE_BITRATE: {
      url.searchParams.set('codec', 'flac');
      break;
    }
  }

  return url.href;
}
