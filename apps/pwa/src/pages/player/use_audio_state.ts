import { useState, useEffect } from 'react';

import eventemitter, { EventType } from './eventemitter';

export default () => {
  const [loading, setLoading] = useState(false);
  const [paused, setPaused] = useState(true);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const waitingListener = () => setLoading(true);
    const canPlayThroughListener = ({ duration: d }: { duration: number }) => {
      setLoading(false);
      setDuration(d);
    };
    const playListener = () => {
      setLoading(false);
      setPaused(false);
    };
    const pauseListener = () => setPaused(true);
    const errorListener = () => {
      setLoading(false);
      setPaused(true);
      setDuration(0);
    };
    eventemitter.on(EventType.AUDIO_WAITING, waitingListener);
    eventemitter.on(EventType.AUDIO_CAN_PLAY_THROUGH, canPlayThroughListener);
    eventemitter.on(EventType.AUDIO_PLAY, playListener);
    eventemitter.on(EventType.AUDIO_PAUSE, pauseListener);
    eventemitter.on(EventType.AUDIO_ERROR, errorListener);
    return () => {
      eventemitter.off(EventType.AUDIO_WAITING, waitingListener);
      eventemitter.off(
        EventType.AUDIO_CAN_PLAY_THROUGH,
        canPlayThroughListener,
      );
      eventemitter.off(EventType.AUDIO_PLAY, playListener);
      eventemitter.off(EventType.AUDIO_PAUSE, pauseListener);
      eventemitter.off(EventType.AUDIO_ERROR, errorListener);
    };
  }, []);

  return {
    loading,
    paused,
    duration,
  };
};
