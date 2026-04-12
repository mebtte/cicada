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

    return () => {
      unlistenToggleLyricPanel();
    };
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return open;
};
