import { useCallback, useEffect, useState } from 'react';
import e, { EventType } from '../eventemitter';

export default () => {
  const [open, setOpen] = useState(false);
  const onClose = useCallback(() => setOpen(false), []);
  const [singerId, setSingerId] = useState('');

  useEffect(() => {
    const unlistenOpen = e.listen(EventType.OPEN_SINGER_DRAWER, ({ id }) => {
      setSingerId(id);
      window.setTimeout(() => setOpen(true), 0);
    });
    return unlistenOpen;
  }, []);

  return { singerId, open, onClose };
};
