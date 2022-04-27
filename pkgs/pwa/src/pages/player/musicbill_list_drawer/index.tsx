import React, { useState, useCallback, useEffect } from 'react';

import eventemitter, { EventType } from '../eventemitter';
import { Music as MusicType } from '../constants';
import MusicbillListDrawer from './musicbill_list_drawer';

const Wrapper = () => {
  const [open, setOpen] = useState(false);
  const [music, setMusic] = useState<MusicType>(null);
  const onClose = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const openListener = (m: MusicType) => {
      setOpen(true);
      setMusic(m);
    };
    const closeListener = () => setOpen(false);
    eventemitter.on(EventType.OPEN_MUSICBILL_LIST_DRAWER, openListener);
    eventemitter.on(EventType.OPEN_MUSIC_DRAWER, closeListener);
    eventemitter.on(EventType.OPEN_SINGER_DRAWER, closeListener);
    return () => {
      eventemitter.off(EventType.OPEN_MUSICBILL_LIST_DRAWER, openListener);
      eventemitter.off(EventType.OPEN_MUSIC_DRAWER, closeListener);
      eventemitter.off(EventType.OPEN_SINGER_DRAWER, closeListener);
    };
  }, []);

  if (!music) {
    return null;
  }
  return <MusicbillListDrawer open={open} onClose={onClose} music={music} />;
};

export default React.memo(Wrapper);
