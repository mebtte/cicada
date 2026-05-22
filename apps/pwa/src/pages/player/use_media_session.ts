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
  /**
   * 注册系统媒体键 handler.
   * 只依赖 audio (实例稳定), 不随 music 变化重新注册.
   * 切歌瞬间若 handler 被卸载, macOS Now Playing 会把 next/prev 等系统键
   * 派发到其他媒体应用, 造成加载态下系统级切歌键无效.
   * @author mebtte<i@mebtte.com>
   */
  useEffect(() => {
    if (!('mediaSession' in window.navigator) || !audio) {
      return;
    }
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
  }, [audio]);

  // 同步 metadata: 仅随 music 变化.
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
  }, [music]);

  /**
   * 同步 playbackState.
   * 切歌期间 audio 因 src 变更进入 HAVE_NOTHING, 会触发 'pause' 事件,
   * 直接降级为 'paused' 会让 macOS Now Playing 释放本应用,
   * 后续系统级切歌键将派发到其他应用. 这里在没有可播放数据时保持 'playing',
   * 等到真正暂停 (用户手动或播放结束且数据已就绪) 才置为 'paused'.
   * @author mebtte<i@mebtte.com>
   */
  useEffect(() => {
    if (!('mediaSession' in window.navigator) || !music || !audio) {
      return;
    }
    const sync = () => {
      if (audio.isPaused() && audio.hasPlayableData()) {
        safeSetPlaybackState('paused');
      } else {
        safeSetPlaybackState('playing');
      }
    };

    sync();
    const unlistenPlay = audio.listen('play', sync);
    const unlistenPlaying = audio.listen('playing', sync);
    const unlistenPause = audio.listen('pause', sync);
    const unlistenEnded = audio.listen('ended', sync);
    const unlistenError = audio.listen('error', sync);
    const unlistenEmptied = audio.listen('emptied', sync);
    const unlistenLoadStart = audio.listen('loadstart', sync);
    const unlistenCanplay = audio.listen('canplay', sync);
    const unlistenLoadedData = audio.listen('loadeddata', sync);
    return () => {
      unlistenPlay();
      unlistenPlaying();
      unlistenPause();
      unlistenEnded();
      unlistenError();
      unlistenEmptied();
      unlistenLoadStart();
      unlistenCanplay();
      unlistenLoadedData();
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
