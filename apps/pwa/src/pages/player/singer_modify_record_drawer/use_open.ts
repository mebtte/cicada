import { useCallback, useEffect, useState } from 'react';
import e, { EventType } from '../eventemitter';
import { Artist } from './constants';

export default () => {
  const [artist, setArtist] = useState<Artist | null>(null);
  const [open, setOpen] = useState(false);
  const onClose = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const unlistenOpen = e.listen(
      EventType.OPEN_ARTIST_MODIFY_RECORD_DRAWER,
      (payload) => {
        setArtist(payload.artist);
        return window.setTimeout(() => setOpen(true), 0);
      },
    );
    return unlistenOpen;
  }, []);

  return { artist, open, onClose };
};
