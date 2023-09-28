import { useCallback, useEffect, useState } from 'react';
import e, { EventType } from '../eventemitter';

export default () => {
  const [open, setOpen] = useState(true);
  const onClose = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const unlistenOpen = e.listen(EventType.OPEN_TOTP_DIALOG, () =>
      setOpen(true),
    );
    return unlistenOpen;
  }, []);

  return { open, onClose };
};
