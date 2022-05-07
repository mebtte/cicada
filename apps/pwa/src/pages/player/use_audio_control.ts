import { useCallback } from 'react';

import eventemitter, { EventType } from './eventemitter';

const onPlay = () => eventemitter.emit(EventType.ACTION_PLAY);
const onPause = () => eventemitter.emit(EventType.ACTION_PAUSE);
const onPrevious = () => eventemitter.emit(EventType.ACTION_PREVIOUS);
const onNext = () => eventemitter.emit(EventType.ACTION_NEXT);

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
