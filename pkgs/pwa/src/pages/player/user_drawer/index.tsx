import React from 'react';

import UserDrawer from './user_drawer';
import useOpen from './use_open';

const Wrapper = () => {
  const { open, onClose, id } = useOpen();
  if (!id) {
    return null;
  }
  return <UserDrawer open={open} onClose={onClose} id={id} />;
};

export default Wrapper;
