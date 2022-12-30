import { useEffect } from 'react';
import { getResizedMusicCover } from '@/server/asset';
import e, { EventType } from '../eventemitter';
import { QueueMusic } from '../constants';
import JpegDefaultCover96 from './default_cover_96.jpeg';
import JpegDefaultCover128 from './default_cover_128.jpeg';
import JpegDefaultCover192 from './default_cover_192.jpeg';
import JpegDefaultCover256 from './default_cover_256.jpeg';
import JpegDefaultCover384 from './default_cover_384.jpeg';
import JpegDefaultCover512 from './default_cover_512.jpeg';

function useMediaSession(music?: QueueMusic) {
  useEffect(() => {
    if (music && 'mediaSession' in window.navigator) {
      window.navigator.mediaSession.metadata = new MediaMetadata({
        title: music.name,
        artist: music.singers.map((s) => s.name).join(',') || '未知歌手',
        artwork: [
          {
            src: music.cover
              ? getResizedMusicCover({ id: music.id, size: 96 })
              : JpegDefaultCover96,
            sizes: '96x96',
            type: 'image/jpeg',
          },
          {
            src: music.cover
              ? getResizedMusicCover({ id: music.id, size: 128 })
              : JpegDefaultCover128,
            sizes: '128x128',
            type: 'image/jpeg',
          },
          {
            src: music.cover
              ? getResizedMusicCover({ id: music.id, size: 192 })
              : JpegDefaultCover192,
            sizes: '192x192',
            type: 'image/jpeg',
          },
          {
            src: music.cover
              ? getResizedMusicCover({ id: music.id, size: 256 })
              : JpegDefaultCover256,
            sizes: '256x256',
            type: 'image/jpeg',
          },
          {
            src: music.cover
              ? getResizedMusicCover({ id: music.id, size: 384 })
              : JpegDefaultCover384,
            sizes: '384x384',
            type: 'image/jpeg',
          },
          {
            src: music.cover
              ? getResizedMusicCover({ id: music.id, size: 512 })
              : JpegDefaultCover512,
            sizes: '512x512',
            type: 'image/jpeg',
          },
        ],
      });
      window.navigator.mediaSession.setActionHandler('play', () =>
        e.emit(EventType.ACTION_PLAY, null),
      );
      window.navigator.mediaSession.setActionHandler('pause', () =>
        e.emit(EventType.ACTION_PAUSE, null),
      );
      window.navigator.mediaSession.setActionHandler('previoustrack', () =>
        e.emit(EventType.ACTION_PREVIOUS, null),
      );
      window.navigator.mediaSession.setActionHandler('nexttrack', () =>
        e.emit(EventType.ACTION_NEXT, null),
      );
    }
  }, [music]);
}

export default useMediaSession;
