import { useEffect } from 'react';
import getResizedImage from '@/server/asset/get_resized_image';
import { t } from '@/i18n';
import CustomAudio from '@/utils/custom_audio';
import e, { EventType } from './eventemitter';
import { QueueMusic } from './constants';

const COVER_SIZES = [96, 256, 512];
const DEFAULT_SEEK_OFFSET = 10;

function safeSetActionHandler(
  action: MediaSessionAction,
  handler: MediaSessionActionHandler | null,
) {
  try {
    window.navigator.mediaSession.setActionHandler(action, handler);
  } catch {
    /* action not supported */
  }
}

function useMediaSession({
  music,
  audio,
  paused,
  duration,
}: {
  music?: QueueMusic;
  audio: CustomAudio<QueueMusic> | null;
  paused: boolean;
  duration: number;
}) {
  useEffect(() => {
    if (!('mediaSession' in window.navigator)) {
      return;
    }
    if (!music) {
      window.navigator.mediaSession.metadata = null;
      window.navigator.mediaSession.playbackState = 'none';
      return;
    }
    window.navigator.mediaSession.metadata = new MediaMetadata({
      title: music.name,
      artist:
        music.singers.map((s) => s.name).join(',') || t('unknown_singer'),
      artwork: music.cover
        ? COVER_SIZES.map((size) => ({
            src: getResizedImage({
              url: music.cover,
              size: Math.ceil(size * window.devicePixelRatio),
            }),
            sizes: `${size}x${size}`,
            type: 'image/jpeg',
          }))
        : [],
    });

    const actions: [MediaSessionAction, MediaSessionActionHandler][] = [
      ['play', () => e.emit(EventType.ACTION_PLAY, null)],
      ['pause', () => e.emit(EventType.ACTION_PAUSE, null)],
      ['previoustrack', () => e.emit(EventType.ACTION_PREVIOUS, null)],
      ['nexttrack', () => e.emit(EventType.ACTION_NEXT, null)],
      [
        'seekto',
        (details) => {
          if (typeof details.seekTime === 'number') {
            e.emit(EventType.ACTION_SET_TIME, { second: details.seekTime });
          }
        },
      ],
      [
        'seekbackward',
        (details) => {
          if (!audio) {
            return;
          }
          const offset = details.seekOffset ?? DEFAULT_SEEK_OFFSET;
          const next = Math.max(0, audio.getCurrentTime() - offset);
          e.emit(EventType.ACTION_SET_TIME, { second: next });
        },
      ],
      [
        'seekforward',
        (details) => {
          if (!audio) {
            return;
          }
          const offset = details.seekOffset ?? DEFAULT_SEEK_OFFSET;
          const dur = audio.getDuration();
          const next = Math.min(
            Number.isFinite(dur) ? dur : Infinity,
            audio.getCurrentTime() + offset,
          );
          e.emit(EventType.ACTION_SET_TIME, { second: next });
        },
      ],
    ];
    actions.forEach(([action, handler]) =>
      safeSetActionHandler(action, handler),
    );
    return () => {
      actions.forEach(([action]) => safeSetActionHandler(action, null));
    };
  }, [music, audio]);

  useEffect(() => {
    if (!('mediaSession' in window.navigator) || !music) {
      return;
    }
    window.navigator.mediaSession.playbackState = paused ? 'paused' : 'playing';
  }, [music, paused]);

  useEffect(() => {
    if (
      !('mediaSession' in window.navigator) ||
      !audio ||
      !navigator.mediaSession.setPositionState
    ) {
      return;
    }
    const sync = () => {
      const dur = audio.getDuration();
      const pos = audio.getCurrentTime();
      if (!Number.isFinite(dur) || dur <= 0 || !Number.isFinite(pos)) {
        return;
      }
      try {
        window.navigator.mediaSession.setPositionState({
          duration: dur,
          position: Math.max(0, Math.min(pos, dur)),
          playbackRate: 1,
        });
      } catch {
        /* ignore */
      }
    };
    sync();
    const unlistenSeeked = audio.listen('seeked', sync);
    const unlistenDurationChange = audio.listen('durationchange', sync);
    const unlistenPlay = audio.listen('play', sync);
    const unlistenPause = audio.listen('pause', sync);
    const unlistenRateChange = audio.listen('ratechange', sync);
    return () => {
      unlistenSeeked();
      unlistenDurationChange();
      unlistenPlay();
      unlistenPause();
      unlistenRateChange();
    };
  }, [audio, duration]);
}

export default useMediaSession;
