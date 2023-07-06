import { useCallback, useEffect, useState } from 'react';
import e, { EventType } from '../eventemitter';
import { Singer } from './constants';

export default () => {
  const [singer, setSinger] = useState<Singer | null>(null);
  const [open, setOpen] = useState(false);
  const onClose = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const unlistenOpen = e.listen(
      EventType.OPEN_SINGER_MODIFY_RECORD_DRAWER,
      (payload) => {
        setSinger(payload.singer);
        return window.setTimeout(() => setOpen(true), 0);
      },
    );
    return unlistenOpen;
  }, []);

  return { singer, open, onClose };
};
