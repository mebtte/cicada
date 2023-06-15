import { memo, useState, useCallback, useEffect } from 'react';
import eventemitter, { EventType } from '../eventemitter';
import { MusicWithSingerAliases } from '../constants';
import MusicbillMusicDrawer from './musicbill_music_drawer';

function Wrapper() {
  const [open, setOpen] = useState(false);
  const [music, setMusic] = useState<MusicWithSingerAliases | null>(null);
  const onClose = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const unlistenOpenMusicbillListDrawer = eventemitter.listen(
      EventType.OPEN_ADD_MUSIC_TO_MUSICBILL_DRAWER,
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
  return <MusicbillMusicDrawer open={open} onClose={onClose} music={music} />;
}

export default memo(Wrapper);
