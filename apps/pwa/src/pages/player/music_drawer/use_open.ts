import { useState, useEffect, useCallback } from 'react';
import eventemitter, { EventType } from '../eventemitter';

export default () => {
  const [open, setOpen] = useState(false);
  const onClose = useCallback(() => setOpen(false), []);

  const [id, setId] = useState('');

  useEffect(() => {
    const closeListener = () => setOpen(false);
    const unlistenOpenMusicDrawer = eventemitter.listen(
      EventType.OPEN_MUSIC_DRAWER,
      (data) => {
        setId(data.id);
        return setOpen(true);
      },
    );
    const unlistenOpenSingerDrawer = eventemitter.listen(
      EventType.OPEN_SINGER_DRAWER,
      closeListener,
    );
    const unlistenOpenMusicbillListDrawer = eventemitter.listen(
      EventType.OPEN_MUSICBILL_LIST_DRAWER,
      closeListener,
    );
    const unlistenOpenMusicOperatePopup = eventemitter.listen(
      EventType.OPEN_MUSIC_OPERATE_POPUP,
      closeListener,
    );
    return () => {
      unlistenOpenMusicDrawer();
      unlistenOpenSingerDrawer();
      unlistenOpenMusicbillListDrawer();
      unlistenOpenMusicOperatePopup();
    };
  }, []);

  return {
    open,
    onClose,
    id,
  };
};
