import {
  getMusicAssetOriginalExtension,
  getSmoothMusicAsset,
} from './music_asset';

export enum MusicDownloadQuality {
  ORIGINAL = 'original',
  SMOOTH = 'smooth',
}

export default function getMusicDownloadAsset({
  asset,
  quality,
}: {
  asset: string;
  quality: MusicDownloadQuality;
}) {
  switch (quality) {
    case MusicDownloadQuality.SMOOTH: {
      return {
        url: getSmoothMusicAsset(asset),
        ext: 'm4a',
      };
    }
    case MusicDownloadQuality.ORIGINAL:
    default: {
      return {
        url: asset,
        ext: getMusicAssetOriginalExtension(asset),
      };
    }
  }
}
