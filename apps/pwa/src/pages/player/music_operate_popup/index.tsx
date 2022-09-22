import { memo, useState, useCallback, useEffect } from 'react';
import { Music as MusicType } from '../constants';
import eventemitter, { EventType } from '../eventemitter';
import MusicOperatePopup from './music_operate_popup';

function Wrapper() {
  const [open, setOpen] = useState(false);
  const [music, setMusic] = useState<MusicType | null>(null);
  const onClose = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const closeListener = () => setOpen(false);
    const unlistenOpenMusicOperatePopup = eventemitter.listen(
      EventType.OPEN_MUSIC_OPERATE_POPUP,
      ({ music: m }) => {
        setMusic(m);
        setOpen(true);
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
      unlistenOpenMusicOperatePopup();
      unlistenOpenMusicDrawer();
      unlistenOpenSingerDrawer();
    };
  }, []);

  if (!music) {
    return null;
  }
  return <MusicOperatePopup open={open} onClose={onClose} music={music} />;
}

export default memo(Wrapper);
