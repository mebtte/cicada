import useEvent from '@/utils/use_event';
import { useEffect, useState } from 'react';
import e, { EventType } from '../eventemitter';

export default () => {
  const [id, setId] = useState('');
  const [open, setOpen] = useState(false);
  const onClose = useEvent(() => setOpen(false));

  useEffect(() => {
    const unlistenOpen = e.listen(
      EventType.OPEN_MUSICBILL_SHARED_USER_DRAWER,
      (payload) => {
        setId(payload.id);
        return window.setTimeout(() => setOpen(true), 0);
      },
    );
    return unlistenOpen;
  }, []);

  return { id, open, onClose };
};
