import { memo, useState, useCallback, useEffect } from 'react';
import eventemitter, { EventType } from '../eventemitter';
import { Music as MusicType } from '../constants';
import MusicbillListDrawer from './musicbill_list_drawer';
import useDynamicZIndex from '../use_dynamic_z_index';

function Wrapper() {
  const zIndex = useDynamicZIndex(EventType.OPEN_MUSICBILL_LIST_DRAWER);
  const [open, setOpen] = useState(false);
  const [music, setMusic] = useState<MusicType | null>(null);
  const onClose = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const unlistenOpenMusicbillListDrawer = eventemitter.listen(
      EventType.OPEN_MUSICBILL_LIST_DRAWER,
      ({ music: m }) => {
        setOpen(true);
        setMusic(m);
      },
    );
    return unlistenOpenMusicbillListDrawer;
  }, []);

  if (!music) {
    return null;
  }
  return (
    <MusicbillListDrawer
      open={open}
      onClose={onClose}
      music={music}
      zIndex={zIndex}
    />
  );
}

export default memo(Wrapper);
