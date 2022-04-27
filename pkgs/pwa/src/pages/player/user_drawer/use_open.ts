import { useCallback, useEffect, useState } from 'react';

import eventemitter, { EventType } from '../eventemitter';

export default () => {
  const [open, setOpen] = useState(false);
  const onClose = useCallback(() => setOpen(false), []);

  const [id, setId] = useState('');

  useEffect(() => {
    const openListener = ({ id: newId }: { id: string }) => {
      setId(newId);
      return setOpen(true);
    };

    eventemitter.on(EventType.OPEN_USER_DRAWER, openListener);
    return () =>
      void eventemitter.off(EventType.OPEN_USER_DRAWER, openListener);
  }, []);

  return { open, onClose, id };
};
