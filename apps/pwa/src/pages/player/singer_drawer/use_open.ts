import { useCallback, useEffect, useState } from 'react';
import useDynamicZIndex from '../use_dynamic_z_index';
import e, { EventType } from '../eventemitter';

export default () => {
  const zIndex = useDynamicZIndex(EventType.OPEN_SINGER_DRAWER);
  // const [open, setOpen] = useState(true);
  const [open, setOpen] = useState(false);
  const onClose = useCallback(() => setOpen(false), []);
  // const [singerId, setSingerId] = useState('vaffchhj');
  const [singerId, setSingerId] = useState('');

  useEffect(() => {
    const unlistenOpen = e.listen(EventType.OPEN_SINGER_DRAWER, ({ id }) => {
      setSingerId(id);
      window.setTimeout(() => setOpen(true), 0);
    });
    return unlistenOpen;
  }, []);

  return { zIndex, singerId, open, onClose };
};
