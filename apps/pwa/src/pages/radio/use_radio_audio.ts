import { useCallback, useEffect, useRef, useState } from 'react';
import { debounce } from 'lodash-es';
import CustomAudio from '@/utils/custom_audio';
import getMusicPlaybackAsset from '@/utils/music_playback_asset';
import onVisible from '@/utils/on_visible';
import { MusicPlaybackQuality } from '@/constants/setting';
import { QueueMusic } from '@/features/player/constants';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '@/features/player/eventemitter';
import onError from '@/features/player/use_audio/on_error';
import usePlayRecord from '@/features/player/use_audio/use_play_record';

/**
 * 电台模式专用的精简版 useAudio:
 *   - 强制流畅音质, 不读取 musicPlaybackQuality 设置.
 *   - 首曲不自动播放, 用户点击 play 后续切歌才 autoplay.
 *   - 监听 ended 调用上层 onEnded (即电台队列的 next).
 *   - 复用主播放器的 usePlayRecord, 让播放记录上报落到统一队列.
 */
function useRadioAudio({
  queueMusic,
  onEnded,
}: {
  queueMusic: QueueMusic | undefined;
  onEnded: () => void;
}) {
  const audioRef = useRef<CustomAudio<QueueMusic> | null>(null);
  const queueMusicPidRef = useRef<string | null>(null);
  if (!audioRef.current) {
    audioRef.current = new CustomAudio<QueueMusic>();
  }
  const audio = audioRef.current;

  const [paused, setPaused] = useState(true);
  const [loading, setLoading] = useState(false);
  const userStartedRef = useRef(false);
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;

  useEffect(() => {
    const stopLoadingWhenPlayable = () => {
      if (audio.hasPlayableData()) {
        setLoading(false);
      }
    };
    const unlistenError = audio.listen('error', () => {
      setLoading(false);
      setPaused(true);
      onError();
    });
    const unlistenPlay = audio.listen('play', () => {
      setPaused(false);
    });
    const unlistenPause = audio.listen('pause', () => {
      setLoading(false);
      setPaused(true);
    });
    const unlistenPlaying = audio.listen('playing', () => {
      setLoading(false);
      setPaused(false);
    });
    const unlistenWaiting = audio.listen('waiting', () => {
      if (!audio.isPaused() && !audio.hasPlayableData()) {
        setLoading(true);
      }
    });
    const unlistenStalled = audio.listen('stalled', () => {
      if (!audio.isPaused() && !audio.hasPlayableData()) {
        setLoading(true);
      }
    });
    const unlistenLoadStart = audio.listen('loadstart', () => setLoading(true));
    // 歌词 / 媒体控制依赖全局 AUDIO_TIME_UPDATED 事件, 电台模式同样发出.
    const onTimeUpdate = debounce(() => {
      const currentTime = audio.getCurrentTime();
      playerEventemitter.emit(PlayerEventType.AUDIO_TIME_UPDATED, {
        currentMillisecond: currentTime * 1000,
      });
    }, 100);
    const unlistenTimeUpdate = audio.listen('timeupdate', onTimeUpdate);
    const unlistenCanplay = audio.listen('canplay', stopLoadingWhenPlayable);
    const unlistenCanplaythrough = audio.listen(
      'canplaythrough',
      stopLoadingWhenPlayable,
    );
    const unlistenLoadedData = audio.listen(
      'loadeddata',
      stopLoadingWhenPlayable,
    );
    const unlistenEnded = audio.listen('ended', () => onEndedRef.current());

    return () => {
      unlistenError();
      unlistenPlay();
      unlistenPause();
      unlistenPlaying();
      unlistenWaiting();
      unlistenStalled();
      unlistenLoadStart();
      unlistenTimeUpdate();
      onTimeUpdate.cancel();
      unlistenCanplay();
      unlistenCanplaythrough();
      unlistenLoadedData();
      unlistenEnded();
    };
  }, [audio]);

  /**
   * 回到前台时以 <audio> 真实状态对账, 见 pages/player/use_audio.
   * @author mebtte<i@mebtte.com>
   */
  useEffect(() => {
    const reconcile = () => {
      setPaused(audio.isPaused());
      setLoading(!audio.isPaused() && !audio.hasPlayableData());
      playerEventemitter.emit(PlayerEventType.AUDIO_TIME_UPDATED, {
        currentMillisecond: audio.getCurrentTime() * 1000,
      });
    };
    return onVisible(reconcile);
  }, [audio]);

  useEffect(() => {
    if (!queueMusic) {
      queueMusicPidRef.current = null;
      audio.clearSource();
      setLoading(false);
      setPaused(true);
      return;
    }
    const src = getMusicPlaybackAsset({
      asset: queueMusic.asset,
      quality: MusicPlaybackQuality.SMOOTH,
    });
    const sourceChanged = audio.getSrc() !== src;
    const queueMusicChanged = queueMusicPidRef.current !== queueMusic.pid;
    queueMusicPidRef.current = queueMusic.pid;

    audio.setSource({ src, extra: queueMusic });
    if (sourceChanged || queueMusicChanged) {
      playerEventemitter.emit(PlayerEventType.AUDIO_TIME_UPDATED, {
        currentMillisecond: 0,
      });
    }
    if (!sourceChanged && queueMusicChanged) {
      // 同一首歌作为新的队列项播放时 src 不变, 浏览器不会自动重载音源.
      audio.setCurrentTime(0);
    }
    setLoading(sourceChanged || !audio.hasPlayableData());
    if (sourceChanged || queueMusicChanged) {
      if (userStartedRef.current) {
        // 用户已经点过一次 play, 切歌后自动续播
        audio.play();
      } else {
        // 防御性 pause: <audio autoplay> 在某些环境下仍可能自动播放,
        // 而进入电台模式必须等用户点 play 才开始.
        audio.pause();
      }
    }
  }, [audio, queueMusic]);

  const play = useCallback(() => {
    userStartedRef.current = true;
    audio.play();
  }, [audio]);
  const pause = useCallback(() => audio.pause(), [audio]);
  const togglePlay = useCallback(() => {
    if (audio.isPaused()) {
      play();
    } else {
      pause();
    }
  }, [audio, play, pause]);

  // 离开电台页面时停止音频, 避免与主播放器同时发声.
  useEffect(
    () => () => {
      audio.pause();
      audio.clearSource();
    },
    [audio],
  );

  usePlayRecord(audio, queueMusic);

  return { audio, paused, loading, play, pause, togglePlay };
}

export default useRadioAudio;
