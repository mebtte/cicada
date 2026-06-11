import { useEffect } from 'react';
import getResizedImage from '@/server/asset/get_resized_image';
import { t } from '@/i18n';
import CustomAudio from '@/utils/custom_audio';
import { QueueMusic } from '@/pages/player/constants';

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
  onPlay,
  onPause,
  onNext,
}: {
  music: QueueMusic | undefined;
  audio: CustomAudio<QueueMusic>;
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

  useEffect(() => {
    if (!('mediaSession' in window.navigator) || !music) {
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
    const unlistenLoadStart = audio.listen('loadstart', sync);
    const unlistenCanplay = audio.listen('canplay', sync);
    return () => {
      unlistenPlay();
      unlistenPlaying();
      unlistenPause();
      unlistenEnded();
      unlistenError();
      unlistenLoadStart();
      unlistenCanplay();
    };
  }, [music, audio]);
}

export default useRadioMediaSession;
