import { useEffect, useState } from 'react';
import eventemitter, { EventType } from './eventemitter';

let currentMillisecondCache = 0;
eventemitter.listen(EventType.AUDIO_TIME_UPDATED, (payload) => {
  currentMillisecondCache = payload.currentMillisecond;
});

function useAudioCurrentMillisecond() {
  const [currentMillisecond, setCurrentMillisecond] = useState(
    currentMillisecondCache,
  );

  useEffect(() => {
    const unlistAudioTimeUpdated = eventemitter.listen(
      EventType.AUDIO_TIME_UPDATED,
      (payload) => setCurrentMillisecond(payload.currentMillisecond),
    );
    return unlistAudioTimeUpdated;
  }, []);

  return currentMillisecond;
}

export default useAudioCurrentMillisecond;
