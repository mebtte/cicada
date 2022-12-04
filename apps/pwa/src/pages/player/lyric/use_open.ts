import { useCallback, useEffect, useState } from 'react';
import usePathnameChange from '@/utils/use_pathname_change';
import eventemitter, { EventType } from '../eventemitter';

export default () => {
  const [open, setOpen] = useState(false);
  const onClose = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const unlistenCloseLyric = eventemitter.listen(EventType.CLOSE_LYRIC, () =>
      setOpen(false),
    );
    const unlistenToggleLyric = eventemitter.listen(
      EventType.TOGGEL_LYRIC,
      () => setOpen((o) => !o),
    );
    return () => {
      unlistenCloseLyric();
      unlistenToggleLyric();
    };
  }, []);

  usePathnameChange(() => setOpen(false));

  useEffect(() => {
    if (open) {
      const keydownListener = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          setOpen(false);
        }
      };
      document.addEventListener('keydown', keydownListener);
      return () => document.removeEventListener('keydown', keydownListener);
    }
  }, [open]);

  return { open, onClose };
};
