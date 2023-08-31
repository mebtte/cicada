import { useEffect, useMemo, useState } from 'react';
import throttle from 'lodash/throttle';
import CustomAudio from '@/utils/custom_audio';
import { QueueMusic } from '../constants';
import onError from './on_error';
import eventemitter, { EventType } from '../eventemitter';
import useCache from './use_cache';
import useVolume from './use_volume';
import useAction from './use_action';

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

  /**
   * listen event
   * @author mebtte<hi@mebtte.com>
   */
  useEffect(() => {
    if (audio) {
      const unlistenError = audio.listen('error', onError);
      const unlistenDurationChange = audio.listen('durationchange', () =>
        setDuration(audio.getDuration()),
      );
      const unlistenPlay = audio.listen('play', () => setPaused(false));
      const unlistenPause = audio.listen('pause', () => setPaused(true));
      const unlistenTimeUpdate = audio.listen(
        'timeupdate',
        throttle(
          () =>
            eventemitter.emit(EventType.AUDIO_TIME_UPDATED, {
              currentMillisecond: audio.getCurrentTime() * 1000,
            }),
          300,
        ),
      );
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
      const unlistenLoadedMetadata = audio.listen('loadedmetadata', () =>
        setDuration(audio.getDuration()),
      );

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
        unlistenLoadedMetadata();
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
