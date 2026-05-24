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

  // 仅在播放详情 (歌词面板) 打开时监听 Esc, 按下时收起面板
  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKeydown);
    return () => window.removeEventListener('keydown', onKeydown);
  }, [open]);

  return open;
};
