import { useEffect } from 'react';
import getResizedImage from '@/server/asset/get_resized_image';
import { t } from '@/i18n';
import CustomAudio from '@/utils/custom_audio';
import onVisible from '@/utils/on_visible';
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
        music.performers.map((s) => s.name).join(',') || t('unknown_artist'),
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
   * 切歌期间 audio 因 src 变更会为旧音源触发临时 'pause' 事件,
   * 直接降级为 'paused' 会让 macOS Now Playing 释放本应用,
   * 后续系统级切歌键将派发到其他应用. CustomAudio 会保留切歌前的播放意图,
   * 因此加载新音源时仍保持 'playing', 只有明确暂停才置为 'paused'.
   * 'ended' 时 paused 已静默置为 true 但数据仍就绪, 同样需要避免下发
   * 'paused', 否则 ACTION_NEXT 触发的 setSource 还没跑, 控制权就丢了.
   * @author mebtte<i@mebtte.com>
   */
  useEffect(() => {
    if (!('mediaSession' in window.navigator) || !music || !audio) {
      return;
    }
    const sync = () => {
      if (audio.isPlaybackRequested() || audio.isEnded()) {
        safeSetPlaybackState('playing');
      } else {
        safeSetPlaybackState('paused');
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
    // 后台冻结期间 play/pause 等事件可能漏掉, 回到前台重新对账锁屏状态.
    const unlistenVisible = onVisible(sync);
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
      unlistenVisible();
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
    const unlistenVisible = onVisible(sync);
    const heartbeat = paused ? null : window.setInterval(sync, 1000);
    return () => {
      unlistenSeeked();
      unlistenDurationChange();
      unlistenPlay();
      unlistenPlaying();
      unlistenPause();
      unlistenRateChange();
      unlistenVisible();
      if (heartbeat !== null) {
        window.clearInterval(heartbeat);
      }
    };
  }, [audio, duration, paused]);
}

export default useMediaSession;
