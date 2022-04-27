import React from 'react';

import useOpen from './use_open';
import MusicDrawer from './music_drawer';

const Wrapper = () => {
  const { open, onClose, id } = useOpen();
  if (!id) {
    return null;
  }
  return <MusicDrawer open={open} onClose={onClose} id={id} />;
};

export default React.memo(Wrapper);
