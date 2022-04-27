import React, { useState, useCallback, useEffect } from 'react';

import { Music as MusicType } from '../constants';
import eventemitter, { EventType } from '../eventemitter';
import MusicOperatePopup from './music_operate_popup';

const Wrapper = () => {
  const [open, setOpen] = useState(false);
  const [music, setMusic] = useState<MusicType | null>(null);
  const onClose = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const openListener = (m: MusicType) => {
      setMusic(m);
      setOpen(true);
    };
    const closeListener = () => setOpen(false);
    eventemitter.on(EventType.OPEN_MUSIC_OPERATE_POPUP, openListener);
    eventemitter.on(EventType.OPEN_MUSIC_DRAWER, closeListener);
    eventemitter.on(EventType.OPEN_SINGER_DRAWER, closeListener);
    return () => {
      eventemitter.off(EventType.OPEN_MUSIC_OPERATE_POPUP, openListener);
      eventemitter.off(EventType.OPEN_MUSIC_DRAWER, closeListener);
      eventemitter.off(EventType.OPEN_SINGER_DRAWER, closeListener);
    };
  }, []);

  if (!music) {
    return null;
  }
  return <MusicOperatePopup open={open} onClose={onClose} music={music} />;
};

export default React.memo(Wrapper);
