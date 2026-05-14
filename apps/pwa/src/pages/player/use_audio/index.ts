import { useEffect, useRef, useState } from 'react';
import { debounce } from 'lodash-es';
import CustomAudio from '@/utils/custom_audio';
import { useSetting } from '@/global_states/setting';
import getMusicPlaybackAsset from '@/utils/music_playback_asset';
import { QueueMusic } from '../constants';
import onError from './on_error';
import eventemitter, { EventType } from '../eventemitter';
import useCache from './use_cache';
import useVolume from './use_volume';
import useAction from './use_action';
import usePlayRecord from './use_play_record';

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
  if (!audioRef.current) {
    audioRef.current = new CustomAudio<QueueMusic>();
  }
  const audio = audioRef.current;

  const [loading, setLoading] = useState(false);
  const [duration, setDuration] = useState(0);
  const [paused, setPaused] = useState(true);
  const [bufferedPercent, setBufferedPercent] = useState(0);

  useVolume(audio);
  useCache(audio, {
    playqueue,
    currentPlayqueuePosition,
    musicPlaybackQuality,
  });
  useAction(audio);
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
      setDuration(audio.getDuration()),
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
   * 切歌: 复用同一个 audio 实例, 只更新 src.
   * 切歌时主动重置进度/duration/buffer, 等新源的 loadstart 触发 loading.
   * @author mebtte<i@mebtte.com>
   */
  useEffect(() => {
    setDuration(0);
    setBufferedPercent(0);
    eventemitter.emit(EventType.AUDIO_TIME_UPDATED, {
      currentMillisecond: 0,
    });
    if (queueMusic) {
      audio.setSource({
        src: getMusicPlaybackAsset({
          asset: queueMusic.asset,
          quality: musicPlaybackQuality,
        }),
        extra: queueMusic,
      });
    } else {
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
