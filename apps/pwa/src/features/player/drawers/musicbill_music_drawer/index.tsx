import { memo, useState, useCallback, useEffect } from 'react';
import eventemitter, { EventType } from '../../eventemitter';
import { MusicWithArtistAliases } from '../../constants';
import MusicbillMusicDrawer from './musicbill_music_drawer';
import useDynamicZIndex from '../../use_dynamic_z_index';

function Wrapper() {
  const [open, setOpen] = useState(false);
  const [music, setMusic] = useState<MusicWithArtistAliases | null>(null);
  const onClose = useCallback(() => setOpen(false), []);
  const zIndex = useDynamicZIndex(EventType.OPEN_MUSICBILL_MUSIC_DRAWER);

  useEffect(() => {
    const unlistenOpenMusicbillListDrawer = eventemitter.listen(
      EventType.OPEN_MUSICBILL_MUSIC_DRAWER,
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
    <MusicbillMusicDrawer
      open={open}
      onClose={onClose}
      music={music}
      zIndex={zIndex}
    />
  );
}

export default memo(Wrapper);
