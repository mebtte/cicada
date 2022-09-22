import { useEffect, useState } from 'react';
import eventemitter, { EventType } from './eventemitter';

function useAudioCurrentMillisecond() {
  const [currentMillisecond, setCurrentMillisecond] = useState(0);

  useEffect(() => {
    const unlistAudioTimeUpdated = eventemitter.listen(
      EventType.AUDIO_TIME_UPDATED,
      ({ currentMillisecond: cm }: { currentMillisecond: number }) =>
        setCurrentMillisecond(cm),
    );
    return unlistAudioTimeUpdated;
  }, []);

  return currentMillisecond;
}

export default useAudioCurrentMillisecond;
