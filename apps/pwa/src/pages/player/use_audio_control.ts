import { useCallback } from 'react';
import eventemitter, { EventType } from './eventemitter';

const onPlay = () => eventemitter.emit(EventType.ACTION_PLAY, null);
const onPause = () => eventemitter.emit(EventType.ACTION_PAUSE, null);
const onPrevious = () => eventemitter.emit(EventType.ACTION_PREVIOUS, null);
const onNext = () => eventemitter.emit(EventType.ACTION_NEXT, null);

export default (loading = false) => {
  const onTogglePlay = useCallback(() => {
    if (loading) {
      return;
    }
    return eventemitter.emit(EventType.ACTION_TOGGLE_PLAY, null);
  }, [loading]);

  return {
    onPlay,
    onPause,
    onTogglePlay,
    onPrevious,
    onNext,
  };
};
