import { useCallback, useEffect, useState } from 'react';
import e, { EventType } from '../eventemitter';

export default () => {
  const [open, setOpen] = useState(false);
  const onClose = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const unlistenOpen = e.listen(EventType.OPEN_CREATE_MUSIC_DIALOG, () =>
      setOpen(true),
    );
    return unlistenOpen;
  }, []);

  return { open, onClose };
};
