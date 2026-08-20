import { useEffect, useLayoutEffect } from 'react';
import getResizedImage from '@/server/asset/get_resized_image';
import { t } from '@/i18n';
import CustomAudio from '@/utils/custom_audio';
import onVisible from '@/utils/on_visible';
import { QueueMusic } from '@/features/player/constants';

const COVER_SIZES = [96, 256, 512];

// 电台模式下不支持的系统媒体操作, 显式清空避免遗留主播放器的旧 handler.
const UNSUPPORTED_ACTIONS: MediaSessionAction[] = [
  'previoustrack',
  'seekbackward',
  'seekforward',
  'seekto',
  'stop',
];

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

/**
 * 电台模式的 media session: 只暴露 play / pause / nexttrack 三个操作给
 * 系统级播放控制 (锁屏、耳机等), 不暴露上一首 / 进度跳转.
 */
function useRadioMediaSession({
  music,
  audio,
  paused,
  onPlay,
  onPause,
  onNext,
}: {
  music: QueueMusic | undefined;
  audio: CustomAudio<QueueMusic>;
  paused: boolean;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
}) {
  useEffect(() => {
    if (!('mediaSession' in window.navigator)) {
      return;
    }
    safeSetActionHandler('play', onPlay);
    safeSetActionHandler('pause', onPause);
    safeSetActionHandler('nexttrack', onNext);
    // 显式清空主播放器可能留下的 handler.
    UNSUPPORTED_ACTIONS.forEach((action) =>
      safeSetActionHandler(action, null),
    );
    return () => {
      safeSetActionHandler('play', null);
      safeSetActionHandler('pause', null);
      safeSetActionHandler('nexttrack', null);
    };
  }, [onPlay, onPause, onNext]);

  // 必须早于 useRadioAudio 的普通 effect 切换 src, 避免 iOS 闪回旧曲目.
  useLayoutEffect(() => {
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

  useEffect(() => {
    if (!('mediaSession' in window.navigator) || !music) {
      return;
    }
    const sync = () => {
      // 切换电台歌曲时旧音源会产生临时 pause, 继续遵循 CustomAudio 保留的
      // 播放意图, 避免 macOS Now Playing 在新音源加载期间释放下一首控制权.
      // ended 同样保持 playing, 直到电台队列切换到下一首.
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
    const unlistenLoadStart = audio.listen('loadstart', sync);
    const unlistenCanplay = audio.listen('canplay', sync);
    // 后台冻结期间 play/pause 等事件可能漏掉, 回到前台重新对账锁屏状态.
    const unlistenVisible = onVisible(sync);
    return () => {
      unlistenPlay();
      unlistenPlaying();
      unlistenPause();
      unlistenEnded();
      unlistenError();
      unlistenLoadStart();
      unlistenCanplay();
      unlistenVisible();
    };
  }, [music, audio]);

  useEffect(() => {
    if (
      !('mediaSession' in window.navigator) ||
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
  }, [audio, paused]);
}

export default useRadioMediaSession;
