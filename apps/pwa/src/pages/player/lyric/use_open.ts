import { useCallback, useEffect, useState } from 'react';
import usePathnameChange from '#/utils/use_pathname_change';
import eventemitter, { EventType } from '../eventemitter';

export default () => {
  const [open, setOpen] = useState(false);
  const onClose = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const closeListener = () => setOpen(false);
    const toggleListener = () => setOpen((o) => !o);
    eventemitter.on(EventType.CLOSE_LYRIC, closeListener);
    eventemitter.on(EventType.TOGGEL_LYRIC, toggleListener);
    return () => {
      eventemitter.off(EventType.CLOSE_LYRIC, closeListener);
      eventemitter.off(EventType.TOGGEL_LYRIC, toggleListener);
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
