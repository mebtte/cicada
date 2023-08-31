import { useEffect, useMemo, useState } from 'react';
import throttle from 'lodash/throttle';
import CustomAudio from '@/utils/custom_audio';
import debugSetting from '@/global_states/debug_setting';
import { QueueMusic } from '../constants';
import onError from './on_error';
import eventemitter, { EventType } from '../eventemitter';
import useCache from './use_cache';
import useVolume from './use_volume';
import useAction from './use_action';
import usePlayRecord from './use_play_record';

function useAudio({ queueMusic }: { queueMusic?: QueueMusic }) {
  const audio = useMemo(() => {
    if (queueMusic) {
      return new CustomAudio({ src: queueMusic.asset, extra: queueMusic });
    }
    return null;
  }, [queueMusic]);

  const [loading, setLoading] = useState(true);
  const [duration, setDuration] = useState(0);
  const [paused, setPaused] = useState(true);
  const [bufferedPercent, setBufferedPercent] = useState(0);

  useVolume(audio);
  useCache(audio);
  useAction(audio);
  usePlayRecord(audio);

  /**
   * listen event
   * @author mebtte<hi@mebtte.com>
   */
  useEffect(() => {
    if (audio) {
      const unlistenError = audio.listen('error', onError);
      const unlistenDurationChange = audio.listen('durationchange', () => {
        const d = audio.getDuration();
        if (debugSetting.get().audioLogEnabled) {
          // eslint-disable-next-line no-console
          console.log('audio duration change: ', d);
        }
        return setDuration(d);
      });
      const unlistenPlay = audio.listen('play', () => {
        if (debugSetting.get().audioLogEnabled) {
          // eslint-disable-next-line no-console
          console.log('audio play');
        }
        return setPaused(false);
      });
      const unlistenPause = audio.listen('pause', () => {
        if (debugSetting.get().audioLogEnabled) {
          // eslint-disable-next-line no-console
          console.log('audio pause');
        }
        return setPaused(true);
      });
      const unlistenTimeUpdate = audio.listen(
        'timeupdate',
        throttle(() => {
          const currentTime = audio.getCurrentTime();
          if (debugSetting.get().audioLogEnabled) {
            // eslint-disable-next-line no-console
            console.log('audio time update: ', currentTime);
          }
          return eventemitter.emit(EventType.AUDIO_TIME_UPDATED, {
            currentMillisecond: currentTime * 1000,
          });
        }, 300),
      );
      const unlistenEnded = audio.listen('ended', () => {
        if (debugSetting.get().audioLogEnabled) {
          // eslint-disable-next-line no-console
          console.log('audio ended');
        }
        return eventemitter.emit(EventType.ACTION_NEXT, null);
      });
      const unlistenWaiting = audio.listen('waiting', () => {
        if (debugSetting.get().audioLogEnabled) {
          // eslint-disable-next-line no-console
          console.log('audio waiting');
        }
        return setLoading(true);
      });
      const unlistenPlaying = audio.listen('playing', () => {
        if (debugSetting.get().audioLogEnabled) {
          // eslint-disable-next-line no-console
          console.log('audio playing');
        }
        return setLoading(false);
      });
      const unlistenProgress = audio.listen('progress', () => {
        const bp = audio.getBufferedPercent();
        if (debugSetting.get().audioLogEnabled) {
          // eslint-disable-next-line no-console
          console.log('audio progress: ', bp, '%');
        }
        return setBufferedPercent(bp);
      });
      const unlistenSeeking = audio.listen('seeking', () => {
        if (debugSetting.get().audioLogEnabled) {
          // eslint-disable-next-line no-console
          console.log('audio seeking');
        }
        return setLoading(true);
      });
      const unlistenSeeked = audio.listen('seeked', () => {
        if (debugSetting.get().audioLogEnabled) {
          // eslint-disable-next-line no-console
          console.log('audio seeked');
        }
        return setLoading(false);
      });

      return () => {
        unlistenError();
        unlistenDurationChange();
        unlistenPlay();
        unlistenPause();
        unlistenTimeUpdate();
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
   * make sure this on last of hooks
   * @author mebtte<hi@mebtte.com>
   */
  useEffect(() => {
    if (audio) {
      return () => {
        audio.pause(); // pause audio and let it be garbage collected

        setLoading(true);
        setDuration(0);
        setPaused(true);
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
  };
}

export default useAudio;
