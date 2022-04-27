import React from 'react';

import SingerDrawer from './singer_drawer';
import useOpen from './use_open';

const Wrapper = () => {
  const { open, onClose, id } = useOpen();

  if (!id) {
    return null;
  }
  return <SingerDrawer open={open} onClose={onClose} id={id} />;
};

export default React.memo(Wrapper);
