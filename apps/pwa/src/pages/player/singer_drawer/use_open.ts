import { useCallback, useEffect, useState } from 'react';

import eventemitter, { EventType } from '../eventemitter';

export default () => {
  const [open, setOpen] = useState(false);
  const onClose = useCallback(() => setOpen(false), []);

  const [id, setId] = useState('');

  useEffect(() => {
    const openListener = (data: { id: string }) => {
      setId(data.id);
      return setOpen(true);
    };
    const closeListener = () => setOpen(false);

    eventemitter.on(EventType.OPEN_SINGER_DRAWER, openListener);

    eventemitter.on(EventType.OPEN_MUSIC_DRAWER, closeListener);
    eventemitter.on(EventType.OPEN_MUSICBILL_LIST_DRAWER, closeListener);
    eventemitter.on(EventType.OPEN_MUSIC_OPERATE_POPUP, closeListener);
    return () => {
      eventemitter.off(EventType.OPEN_SINGER_DRAWER, openListener);

      eventemitter.off(EventType.OPEN_MUSIC_DRAWER, closeListener);
      eventemitter.off(EventType.OPEN_MUSICBILL_LIST_DRAWER, closeListener);
      eventemitter.off(EventType.OPEN_MUSIC_OPERATE_POPUP, closeListener);
    };
  }, []);

  return { open, onClose, id };
};
