import { useCallback, useEffect, useState } from 'react';

import eventemitter, { EventType } from '../eventemitter';

export default () => {
  const [open, setOpen] = useState(false);
  const onClose = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const openListener = () => setOpen(true);
    eventemitter.on(EventType.OPEN_EDIT_DIALOG, openListener);
    return () =>
      void eventemitter.off(EventType.OPEN_EDIT_DIALOG, openListener);
  }, []);

  return { open, onClose };
};
