import { useEffect, useMemo, useState } from 'react';
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
  const audio = useMemo(() => {
    if (queueMusic) {
      return new CustomAudio({
        src: getMusicPlaybackAsset({
          asset: queueMusic.asset,
          quality: musicPlaybackQuality,
        }),
        extra: queueMusic,
      });
    }
    return null;
  }, [queueMusic, musicPlaybackQuality]);

  const [loading, setLoading] = useState(false);
  const [duration, setDuration] = useState(0);
  const [paused, setPaused] = useState(!audio);
  const [bufferedPercent, setBufferedPercent] = useState(0);

  useVolume(audio);
  useCache(audio, {
    playqueue,
    currentPlayqueuePosition,
    musicPlaybackQuality,
  });
  useAction(audio);
  usePlayRecord(audio);

  /**
   * listen event
   * @author mebtte<i@mebtte.com>
   */
  useEffect(() => {
    if (audio) {
      const unlistenError = audio.listen('error', () => {
        setLoading(false);
        setBufferedPercent(0);
        onError();
      });
      const unlistenDurationChange = audio.listen('durationchange', () =>
        setDuration(audio.getDuration()),
      );
      const unlistenPlay = audio.listen('play', () => setPaused(false));
      const unlistenPause = audio.listen('pause', () => setPaused(true));
      const onTimeUpdate = debounce(() => {
        const currentTime = audio.getCurrentTime();
        return eventemitter.emit(EventType.AUDIO_TIME_UPDATED, {
          currentMillisecond: currentTime * 1000,
        });
      }, 100);
      const unlistenTimeUpdate = audio.listen('timeupdate', onTimeUpdate);
      const unlistenEnded = audio.listen('ended', () =>
        eventemitter.emit(EventType.ACTION_NEXT, null),
      );
      const unlistenWaiting = audio.listen('waiting', () => setLoading(true));
      const unlistenPlaying = audio.listen('playing', () => setLoading(false));
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
        unlistenWaiting();
        unlistenPlaying();
        unlistenProgress();
        unlistenSeeking();
        unlistenSeeked();
      };
    }
  }, [audio]);

  /**
   * reset all data
   * make sure this keep last of hooks
   * @author mebtte<i@mebtte.com>
   */
  useEffect(() => {
    setPaused(!audio);
    if (audio) {
      return () => {
        audio.pause(); // pause audio and let it be garbage collected

        setLoading(true);
        setDuration(0);
        setBufferedPercent(0);
        eventemitter.emit(EventType.AUDIO_TIME_UPDATED, {
          currentMillisecond: 0,
        });
      };
    }
  }, [audio]);

  return {
    loading,
    duration,
    paused,
    bufferedPercent,
    audio,
  };
}

export default useAudio;
