import useEvent from '@/utils/use_event';
import { useEffect, useState } from 'react';
import e, { EventType } from '../eventemitter';

export default () => {
  const [open, setOpen] = useState(false);
  const onClose = useEvent(() => setOpen(false));

  useEffect(() => {
    const unlistenOpen = e.listen(EventType.OPEN_SHARE_DRAWER, () =>
      setOpen(true),
    );
    return unlistenOpen;
  }, []);

  return { open, onClose };
};
