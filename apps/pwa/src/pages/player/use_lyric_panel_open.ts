import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import eventemitter, { EventType } from './eventemitter';

export default () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const unlistenToggleLyricPanel = eventemitter.listen(
      EventType.TOGGLE_LYRIC_PANEL,
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

  useEffect(() => {
    setOpen(false);
  }, [location]);

  return open;
};
