import { useContext } from 'react';
import MusicbillSharedUserDrawer from './musicbill_shared_user_drawer';
import Context from '../context';
import useOpen from './use_open';
import useDynamicZIndex from '../use_dynamic_z_index';
import { EventType } from '../eventemitter';

function Wrapper() {
  const { musicbillList } = useContext(Context);
  const { id, open, onClose } = useOpen();
  const zIndex = useDynamicZIndex(EventType.OPEN_MUSICBILL_SHARED_USER_DRAWER);

  const musicbill = musicbillList.find((mb) => mb.id === id);
  if (!musicbill) {
    return null;
  }
  return (
    <MusicbillSharedUserDrawer
      open={open}
      onClose={onClose}
      musicbill={musicbill}
      zIndex={zIndex}
    />
  );
}

export default Wrapper;
