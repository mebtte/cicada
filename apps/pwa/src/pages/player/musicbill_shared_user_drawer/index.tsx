import { useContext } from 'react';
import MusicbillSharedUserDrawer from './musicbill_shared_user_drawer';
import Context from '../context';
import useOpen from './use_open';

function Wrapper() {
  const { musicbillList } = useContext(Context);
  const { id, open, onClose } = useOpen();

  const musicbill = musicbillList.find((mb) => mb.id === id);
  if (!musicbill) {
    return null;
  }
  return (
    <MusicbillSharedUserDrawer
      open={open}
      onClose={onClose}
      musicbill={musicbill}
    />
  );
}

export default Wrapper;
