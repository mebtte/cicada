import { useEffect } from 'react';
import getResizedImage from '@/server/asset/get_resized_image';
import { t } from '@/i18n';
import CustomAudio from '@/utils/custom_audio';
import e, { EventType } from './eventemitter';
import { QueueMusic } from './constants';

const COVER_SIZES = [96, 256, 512];

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

function safeSetPlaybackState(state: MediaSessionPlaybackState) {
  try {
    window.navigator.mediaSession.playbackState = state;
  } catch {
    /* ignore */
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
      safeSetPlaybackState('none');
      return;
    }
    window.navigator.mediaSession.metadata = new MediaMetadata({
      title: music.name,
      artist:
        music.singers.map((s) => s.name).join(',') || t('unknown_singer'),
      artwork: music.cover
        ? COVER_SIZES.map((size) => ({
            src: getResizedImage({ url: music.cover, size }),
            sizes: `${size}x${size}`,
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
        'stop',
        () => {
          if (!audio) {
            return;
          }
          audio.pause();
          audio.setCurrentTime(0);
          e.emit(EventType.AUDIO_TIME_UPDATED, { currentMillisecond: 0 });
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
    safeSetPlaybackState(paused ? 'paused' : 'playing');
  }, [music, paused]);

  useEffect(() => {
    if (!('mediaSession' in window.navigator) || !music || !audio) {
      return;
    }
    const sync = () =>
      safeSetPlaybackState(audio.isPaused() ? 'paused' : 'playing');
    const setPlaying = () => safeSetPlaybackState('playing');
    const setPaused = () => safeSetPlaybackState('paused');

    sync();
    const unlistenPlay = audio.listen('play', setPlaying);
    const unlistenPlaying = audio.listen('playing', setPlaying);
    const unlistenPause = audio.listen('pause', setPaused);
    const unlistenEnded = audio.listen('ended', setPaused);
    const unlistenError = audio.listen('error', setPaused);
    return () => {
      unlistenPlay();
      unlistenPlaying();
      unlistenPause();
      unlistenEnded();
      unlistenError();
    };
  }, [music, audio]);

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
    const unlistenPlaying = audio.listen('playing', sync);
    const unlistenPause = audio.listen('pause', sync);
    const unlistenRateChange = audio.listen('ratechange', sync);
    const heartbeat = paused ? null : window.setInterval(sync, 1000);
    return () => {
      unlistenSeeked();
      unlistenDurationChange();
      unlistenPlay();
      unlistenPlaying();
      unlistenPause();
      unlistenRateChange();
      if (heartbeat !== null) {
        window.clearInterval(heartbeat);
      }
    };
  }, [audio, duration, paused]);
}

export default useMediaSession;
