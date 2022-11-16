import Drawer from '#/components/drawer';
import { CSSProperties } from 'react';
import { EventType } from '../eventemitter';
import useDynamicZIndex from '../use_dynamic_z_index';

const bodyProps: { style: CSSProperties } = {
  style: {
    width: '90%',
    maxWidth: 400,
  },
};

function UserDrawer({
  open,
  onClose,
  id,
}: {
  open: boolean;
  onClose: () => void;
  id: string;
}) {
  const zIndex = useDynamicZIndex(EventType.OPEN_USER_DRAWER);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      maskProps={{
        style: { zIndex },
      }}
      bodyProps={bodyProps}
    >
      todo: {id}
    </Drawer>
  );
}

export default UserDrawer;
