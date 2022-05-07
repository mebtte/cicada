import { useEffect, useState } from 'react';

import { PlayMode, PLAY_MODES } from './constants';
import { PLAY_MODE } from '../../constants/storage_key';
import eventemitter, { EventType } from './eventemitter';

export default () => {
  const [playMode, setPlayMode] = useState<PlayMode>(() => {
    const pm = localStorage.getItem(PLAY_MODE) as PlayMode;
    return pm && PLAY_MODES.includes(pm) ? pm : PlayMode.SQ;
  });

  useEffect(() => {
    const playModeChangeListener = (pm: PlayMode) => setPlayMode(pm);
    eventemitter.on(EventType.CHANGE_PLAY_MODE, playModeChangeListener);
    return () =>
      void eventemitter.off(EventType.CHANGE_PLAY_MODE, playModeChangeListener);
  }, []);

  return playMode;
};
