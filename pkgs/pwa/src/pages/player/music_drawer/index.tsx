import { memo } from 'react';

import useOpen from './use_open';
import MusicDrawer from './music_drawer';

function Wrapper() {
  const { open, onClose, id } = useOpen();
  if (!id) {
    return null;
  }
  return <MusicDrawer open={open} onClose={onClose} id={id} />;
}

export default memo(Wrapper);
