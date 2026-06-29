import { useContext } from 'react';
import MusicbillFollowedArtistDrawer from './musicbill_followed_artist_drawer';
import Context from '../context';
import useOpen from './use_open';
import useDynamicZIndex from '../use_dynamic_z_index';
import { EventType } from '../eventemitter';

function Wrapper() {
  const { musicbillList } = useContext(Context);
  const { id, open, onClose } = useOpen();
  const zIndex = useDynamicZIndex(EventType.OPEN_MUSICBILL_FOLLOWED_ARTIST_DRAWER);

  const musicbill = musicbillList.find((mb) => mb.id === id);
  if (!musicbill) {
    return null;
  }
  return (
    <MusicbillFollowedArtistDrawer
      open={open}
      onClose={onClose}
      musicbillId={musicbill.id}
      zIndex={zIndex}
    />
  );
}

export default Wrapper;
