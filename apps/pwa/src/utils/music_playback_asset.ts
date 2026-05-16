import { MusicPlaybackQuality } from '@/constants/setting';
import {
  getSmoothMusicAsset,
  getSourceBitrateMusicAsset,
} from './music_asset';

export default function getMusicPlaybackAsset({
  asset,
  quality,
}: {
  asset: string;
  quality: MusicPlaybackQuality;
}) {
  switch (quality) {
    case MusicPlaybackQuality.SMOOTH: {
      return getSmoothMusicAsset(asset);
    }
    case MusicPlaybackQuality.SOURCE_BITRATE: {
      return getSourceBitrateMusicAsset(asset);
    }
  }
}
