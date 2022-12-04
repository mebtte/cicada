import { useEffect, useState } from 'react';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../eventemitter';

export default () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const unlistenToggleLyricPanel = playerEventemitter.listen(
      PlayerEventType.TOGGLE_LYRIC_PANEL,
      (data) => (data ? setOpen(data.open) : setOpen((o) => !o)),
    );

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      unlistenToggleLyricPanel();
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  return open;
};
