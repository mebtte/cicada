import { memo } from 'react';
import useOpen from './use_open';
import MusicDrawer from './music_drawer';

function Wrapper() {
  const { zIndex, open, onClose, id } = useOpen();
  if (id) {
    return (
      <MusicDrawer open={open} onClose={onClose} id={id} zIndex={zIndex} />
    );
  }
  return null;
}

export default memo(Wrapper);
