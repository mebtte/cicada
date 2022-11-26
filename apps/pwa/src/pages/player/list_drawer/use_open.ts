import { useCallback, useEffect, useState } from 'react';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../eventemitter';

export default () => {
  const [open, setOpen] = useState(false);
  const onClose = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const unlistenOpen = playerEventemitter.listen(
      PlayerEventType.OPEN_PLAYLIST_PLAYQUEUE_DRAWER,
      () => setOpen(true),
    );
    return unlistenOpen;
  }, []);

  return { open, onClose };
};
