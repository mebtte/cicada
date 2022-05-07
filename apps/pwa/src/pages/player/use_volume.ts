import { useState, useEffect } from 'react';
import debounce from 'lodash/debounce';

import { PLAYER_VOLUME } from '@/constants/storage_key';
import eventemitter, { EventType } from './eventemitter';

const getInitialVolume = () => {
  const localString = localStorage.getItem(PLAYER_VOLUME);
  if (!localString) {
    return 1;
  }
  const volume = +localString;
  if (!volume || volume <= 0 || volume > 1) {
    return 1;
  }
  return volume;
};
const saveVolume = debounce(
  (volume: number) => localStorage.setItem(PLAYER_VOLUME, `${volume}`),
  1000,
);

export default () => {
  const [volume, setVolume] = useState(getInitialVolume);

  useEffect(() => {
    const updateListener = (v: number) => {
      setVolume(v);
      saveVolume(v);
    };
    eventemitter.on(EventType.ACTION_UPDATE_VOLUME, updateListener);
    return () =>
      void eventemitter.off(EventType.ACTION_UPDATE_VOLUME, updateListener);
  }, []);

  return volume;
};
