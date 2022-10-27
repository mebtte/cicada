import { useCallback, useEffect, useState } from 'react';
import drawerZIndex from '../drawer_z_index';
import e, { EventType } from '../eventemitter';

export default () => {
  const [zIndex, setZIndex] = useState(() => drawerZIndex.get().zIndex);
  const [open, setOpen] = useState(false);
  const onClose = useCallback(() => setOpen(false), []);
  const [singerId, setSingerId] = useState('');

  useEffect(() => {
    const unlistenOpen = e.listen(EventType.OPEN_SINGER_DRAWER, ({ id }) => {
      setSingerId(id);
      setZIndex(drawerZIndex.get().zIndex);
      window.setTimeout(() => setOpen(true), 0);
    });
    return unlistenOpen;
  }, []);

  return { zIndex, singerId, open, onClose };
};
