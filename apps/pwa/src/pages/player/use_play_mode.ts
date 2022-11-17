import { useEffect, useState } from 'react';
import { PlayMode } from '@/constants';
import storage, { Key } from '@/storage';
import eventemitter, { EventType } from './eventemitter';

export default () => {
  const [playMode, setPlayMode] = useState(PlayMode.SQ);

  useEffect(() => {
    storage.getItem(Key.PLAY_MODE).then((pm) => {
      if (pm) {
        setPlayMode(pm);
      }
    });
  }, []);

  useEffect(() => {
    const unlistenChangePlayMode = eventemitter.listen(
      EventType.CHANGE_PLAY_MODE,
      ({ playMode: pm }) => setPlayMode(pm),
    );
    return unlistenChangePlayMode;
  }, []);

  return playMode;
};
