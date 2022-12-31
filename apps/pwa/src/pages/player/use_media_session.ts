import { useEffect } from 'react';
import { getResizedMusicCover } from '@/server/asset';
import e, { EventType } from './eventemitter';
import { QueueMusic } from './constants';

function useMediaSession(music?: QueueMusic) {
  useEffect(() => {
    if (music && 'mediaSession' in window.navigator) {
      window.navigator.mediaSession.metadata = new MediaMetadata({
        title: music.name,
        artist: music.singers.map((s) => s.name).join(',') || '未知歌手',
        artwork: [
          {
            src: getResizedMusicCover({ id: music.id, size: 96 }),
            sizes: '96x96',
            type: 'image/jpeg',
          },
          {
            src: getResizedMusicCover({ id: music.id, size: 128 }),
            sizes: '128x128',
            type: 'image/jpeg',
          },
          {
            src: getResizedMusicCover({ id: music.id, size: 192 }),
            sizes: '192x192',
            type: 'image/jpeg',
          },
          {
            src: getResizedMusicCover({ id: music.id, size: 256 }),
            sizes: '256x256',
            type: 'image/jpeg',
          },
          {
            src: getResizedMusicCover({ id: music.id, size: 384 }),
            sizes: '384x384',
            type: 'image/jpeg',
          },
          {
            src: getResizedMusicCover({ id: music.id, size: 512 }),
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
