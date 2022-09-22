import { memo, useState, useCallback, useEffect } from 'react';

import eventemitter, { EventType } from '../eventemitter';
import { Music as MusicType } from '../constants';
import MusicbillListDrawer from './musicbill_list_drawer';

function Wrapper() {
  const [open, setOpen] = useState(false);
  const [music, setMusic] = useState<MusicType | null>(null);
  const onClose = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const closeListener = () => setOpen(false);
    const unlistenOpenMusicbillListDrawer = eventemitter.listen(
      EventType.OPEN_MUSICBILL_LIST_DRAWER,
      ({ music: m }) => {
        setOpen(true);
        setMusic(m);
      },
    );
    const unlistenOpenMusicDrawer = eventemitter.listen(
      EventType.OPEN_MUSIC_DRAWER,
      closeListener,
    );
    const unlistenOpenSingerDrawer = eventemitter.listen(
      EventType.OPEN_SINGER_DRAWER,
      closeListener,
    );
    return () => {
      unlistenOpenMusicbillListDrawer();
      unlistenOpenMusicDrawer();
      unlistenOpenSingerDrawer();
    };
  }, []);

  if (!music) {
    return null;
  }
  return <MusicbillListDrawer open={open} onClose={onClose} music={music} />;
}

export default memo(Wrapper);
