import { useEffect, useState } from 'react';
import eventemitter, { EventType } from './eventemitter';

function useAudioCurrentMillisecond() {
  const [currentMillisecond, setCurrentMillisecond] = useState(0);

  useEffect(() => {
    const onAudioTimeUpdated = ({
      currentMillisecond: cm,
    }: {
      currentMillisecond: number;
    }) => setCurrentMillisecond(cm);
    eventemitter.on(EventType.AUDIO_TIME_UPDATED, onAudioTimeUpdated);
    return () =>
      void eventemitter.off(EventType.AUDIO_TIME_UPDATED, onAudioTimeUpdated);
  }, []);

  return currentMillisecond;
}

export default useAudioCurrentMillisecond;
