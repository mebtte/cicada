import { useState, useEffect } from 'react';
import e, { EventType } from './eventemitter';

export default () => {
  const [loading, setLoading] = useState(false);
  const [paused, setPaused] = useState(true);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const unlistenAudioWaiting = e.listen(EventType.AUDIO_WAITING, () =>
      setLoading(true),
    );
    const unlistenAudioCanPlayThrough = e.listen(
      EventType.AUDIO_CAN_PLAY_THROUGH,
      ({ duration: d }: { duration: number }) => {
        setLoading(false);
        setDuration(d);
      },
    );
    const unlistenAudioPlay = e.listen(EventType.AUDIO_PLAY, () => {
      setLoading(false);
      setPaused(false);
    });
    const unlistenAudioPause = e.listen(EventType.AUDIO_PAUSE, () =>
      setPaused(true),
    );
    const unlistenAudioError = e.listen(EventType.AUDIO_ERROR, () => {
      setLoading(false);
      setPaused(true);
      setDuration(0);
    });
    return () => {
      unlistenAudioWaiting();
      unlistenAudioCanPlayThrough();
      unlistenAudioPlay();
      unlistenAudioPause();
      unlistenAudioError();
    };
  }, []);

  return {
    loading,
    paused,
    duration,
  };
};
