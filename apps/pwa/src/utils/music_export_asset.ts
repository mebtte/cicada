import {
  getMusicAssetOriginalExtension,
  getSmoothMusicAsset,
} from './music_asset';

export enum MusicExportQuality {
  ORIGINAL = 'original',
  SMOOTH = 'smooth',
}

export default function getMusicExportAsset({
  asset,
  quality,
}: {
  asset: string;
  quality: MusicExportQuality;
}) {
  switch (quality) {
    case MusicExportQuality.SMOOTH: {
      return {
        url: getSmoothMusicAsset(asset),
        ext: 'm4a',
      };
    }
    case MusicExportQuality.ORIGINAL:
    default: {
      return {
        url: asset,
        ext: getMusicAssetOriginalExtension(asset),
      };
    }
  }
}
