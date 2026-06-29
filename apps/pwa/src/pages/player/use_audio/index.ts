import { useCallback, useEffect, useRef, useState } from 'react';
import { debounce } from 'lodash-es';
import CustomAudio from '@/utils/custom_audio';
import { useSetting } from '@/global_states/setting';
import getMusicPlaybackAsset from '@/utils/music_playback_asset';
import onVisible from '@/utils/on_visible';
import { QueueMusic } from '../constants';
import onError from './on_error';
import eventemitter, { EventType } from '../eventemitter';
import useCache from './use_cache';
import useAction from './use_action';
import usePlayRecord from './use_play_record';

function getFiniteAudioDuration(audio: CustomAudio<QueueMusic>) {
  const duration = audio.getDuration();
  return Number.isFinite(duration) ? duration : 0;
}

function useAudio({
  queueMusic,
  playqueue,
  currentPlayqueuePosition,
}: {
  queueMusic?: QueueMusic;
  playqueue: QueueMusic[];
  currentPlayqueuePosition: number;
}) {
  const musicPlaybackQuality = useSetting((s) => s.musicPlaybackQuality);

  /**
   * 长期持有同一个 <audio> 元素, 通过 setSource 切歌.
   * iOS Safari 锁屏下的播放权限绑定在具体的 HTMLAudioElement 上,
   * 销毁重建会丢失会话, 导致 ended 后无法 autoplay 下一首.
   * @author mebtte<i@mebtte.com>
   */
  const audioRef = useRef<CustomAudio<QueueMusic> | null>(null);
  const queueMusicPidRef = useRef<string | null>(null);
  if (!audioRef.current) {
    audioRef.current = new CustomAudio<QueueMusic>();
  }
  const audio = audioRef.current;

  const [loading, setLoading] = useState(false);
  const [duration, setDuration] = useState(0);
  const [paused, setPaused] = useState(true);
  const [bufferedPercent, setBufferedPercent] = useState(0);

  useCache(audio, {
    playqueue,
    currentPlayqueuePosition,
    musicPlaybackQuality,
  });
  const updateLoadingByPlayRequest = useCallback(() => {
    if (audio.getSrc()) {
      setLoading(!audio.hasPlayableData());
    }
  }, [audio]);
  useAction(audio, {
    onPlayRequest: updateLoadingByPlayRequest,
  });
  usePlayRecord(audio, queueMusic);

  /**
   * listen event
   * @author mebtte<i@mebtte.com>
   */
  useEffect(() => {
    const updateLoadingByPlayableState = () =>
      setLoading(!audio.isPaused() && !audio.hasPlayableData());
    const stopLoadingWhenPlayable = () => {
      if (audio.hasPlayableData()) {
        setLoading(false);
      }
    };
    const unlistenError = audio.listen('error', () => {
      setLoading(false);
      setPaused(true);
      setBufferedPercent(0);
      onError();
    });
    const unlistenDurationChange = audio.listen('durationchange', () =>
      setDuration(getFiniteAudioDuration(audio)),
    );
    const unlistenPlay = audio.listen('play', () => {
      updateLoadingByPlayableState();
      setPaused(false);
    });
    const unlistenPause = audio.listen('pause', () => {
      setLoading(false);
      setPaused(true);
    });
    const onTimeUpdate = debounce(() => {
      stopLoadingWhenPlayable();
      const currentTime = audio.getCurrentTime();
      return eventemitter.emit(EventType.AUDIO_TIME_UPDATED, {
        currentMillisecond: currentTime * 1000,
      });
    }, 100);
    const unlistenTimeUpdate = audio.listen('timeupdate', onTimeUpdate);
    const unlistenEnded = audio.listen('ended', () =>
      eventemitter.emit(EventType.ACTION_NEXT, null),
    );
    const unlistenLoadStart = audio.listen('loadstart', () =>
      setLoading(true),
    );
    const unlistenWaiting = audio.listen(
      'waiting',
      updateLoadingByPlayableState,
    );
    const unlistenStalled = audio.listen(
      'stalled',
      updateLoadingByPlayableState,
    );
    const unlistenLoadedData = audio.listen(
      'loadeddata',
      stopLoadingWhenPlayable,
    );
    const unlistenCanplay = audio.listen('canplay', stopLoadingWhenPlayable);
    const unlistenCanplaythrough = audio.listen(
      'canplaythrough',
      stopLoadingWhenPlayable,
    );
    const unlistenPlaying = audio.listen('playing', () => {
      setLoading(false);
      setPaused(false);
    });
    const unlistenProgress = audio.listen('progress', () =>
      setBufferedPercent(audio.getBufferedPercent()),
    );
    const unlistenSeeking = audio.listen('seeking', () => setLoading(true));
    const unlistenSeeked = audio.listen('seeked', () => setLoading(false));

    return () => {
      unlistenError();
      unlistenDurationChange();
      unlistenPlay();
      unlistenPause();
      unlistenTimeUpdate();
      onTimeUpdate.cancel();
      unlistenEnded();
      unlistenLoadStart();
      unlistenWaiting();
      unlistenStalled();
      unlistenLoadedData();
      unlistenCanplay();
      unlistenCanplaythrough();
      unlistenPlaying();
      unlistenProgress();
      unlistenSeeking();
      unlistenSeeked();
    };
  }, [audio]);

  /**
   * 回到前台时以 <audio> 真实状态对账.
   * 后台被电话等打断时 JS 冻结, pause/timeupdate 等事件不被派发, 恢复后
   * 若不主动重读, paused / 进度 / 缓冲会停留在冻结前. 不主动续播, 仅纠正显示,
   * iOS 打断后的恢复交给用户手势.
   * @author mebtte<i@mebtte.com>
   */
  useEffect(() => {
    const reconcile = () => {
      setPaused(audio.isPaused());
      setBufferedPercent(audio.getBufferedPercent());
      setDuration(getFiniteAudioDuration(audio));
      setLoading(!audio.isPaused() && !audio.hasPlayableData());
      eventemitter.emit(EventType.AUDIO_TIME_UPDATED, {
        currentMillisecond: audio.getCurrentTime() * 1000,
      });
    };
    return onVisible(reconcile);
  }, [audio]);

  /**
   * 切歌: 复用同一个 audio 实例, 只更新 src.
   * 切歌时主动重置进度/duration/buffer/loading, 避免依赖浏览器 loadstart
   * 的派发时机.
   * @author mebtte<i@mebtte.com>
   */
  useEffect(() => {
    if (queueMusic) {
      const src = getMusicPlaybackAsset({
        asset: queueMusic.asset,
        quality: musicPlaybackQuality,
      });
      const sourceChanged = audio.getSrc() !== src;
      const queueMusicChanged = queueMusicPidRef.current !== queueMusic.pid;
      queueMusicPidRef.current = queueMusic.pid;

      if (sourceChanged || queueMusicChanged) {
        setDuration(0);
        setBufferedPercent(0);
        eventemitter.emit(EventType.AUDIO_TIME_UPDATED, {
          currentMillisecond: 0,
        });
      }

      audio.setSource({
        src,
        extra: queueMusic,
      });

      if (!sourceChanged && queueMusicChanged) {
        // 同一首歌作为新的队列项播放时 src 不变, 浏览器不会自动重载音源.
        audio.setCurrentTime(0);
        setDuration(getFiniteAudioDuration(audio));
        setBufferedPercent(audio.getBufferedPercent());
      }

      setLoading(sourceChanged || !audio.hasPlayableData());
      if (sourceChanged || queueMusicChanged) {
        // 加载态切歌会中断上一次 play 请求, 需要为新队列项重新发起播放.
        audio.play();
      }

      const readyStateSyncTimer = window.setTimeout(() => {
        if (audio.getSrc() === src && audio.hasPlayableData()) {
          setLoading(false);
        }
      }, 0);
      return () => window.clearTimeout(readyStateSyncTimer);
    } else {
      queueMusicPidRef.current = null;
      setDuration(0);
      setBufferedPercent(0);
      eventemitter.emit(EventType.AUDIO_TIME_UPDATED, {
        currentMillisecond: 0,
      });
      audio.clearSource();
      setLoading(false);
      setPaused(true);
    }
  }, [audio, queueMusic, musicPlaybackQuality]);

  return {
    loading,
    duration,
    paused,
    bufferedPercent,
    audio,
  };
}

export default useAudio;
