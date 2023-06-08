import { useEffect } from 'react';
import getResizedImage from '@/server/asset/get_resized_image';
import e, { EventType } from './eventemitter';
import { QueueMusic } from './constants';

const COVER_SIZES = [96, 128, 192, 256, 384, 512];

function useMediaSession(music?: QueueMusic) {
  useEffect(() => {
    if (music && 'mediaSession' in window.navigator) {
      window.navigator.mediaSession.metadata = new MediaMetadata({
        title: music.name,
        artist: music.singers.map((s) => s.name).join(',') || '未知歌手',
        artwork: music.cover
          ? COVER_SIZES.map((size) => ({
              src: getResizedImage({ url: music.cover, size }),
              sizes: `${size}x${size}`,
              type: 'image/jpeg',
            }))
          : [],
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
