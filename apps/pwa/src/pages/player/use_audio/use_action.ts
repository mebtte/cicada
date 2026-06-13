import { useEffect } from 'react';
import CustomAudio from '@/utils/custom_audio';
import eventemitter, { EventType } from '../eventemitter';
import { QueueMusic } from '../constants';

export default (
  audio: CustomAudio<QueueMusic> | null,
  {
    onPlayRequest,
  }: {
    onPlayRequest?: () => void;
  } = {},
) => {
  useEffect(() => {
    if (audio) {
      const play = () => {
        onPlayRequest?.();
        audio.play();
      };
      const unlistenActionSetTime = eventemitter.listen(
        EventType.ACTION_SET_TIME,
        ({ second }: { second: number }) =>
          window.setTimeout(() => {
            audio.setCurrentTime(second);
            play();
            eventemitter.emit(EventType.AUDIO_TIME_UPDATED, {
              currentMillisecond: second * 1000,
            });
          }, 0),
      );
      const unlistenActionPlay = eventemitter.listen(
        EventType.ACTION_PLAY,
        play,
      );
      const unlistenActionPause = eventemitter.listen(
        EventType.ACTION_PAUSE,
        () => audio.pause(),
      );
      return () => {
        unlistenActionSetTime();
        unlistenActionPlay();
        unlistenActionPause();
      };
    }
  }, [audio, onPlayRequest]);
};
