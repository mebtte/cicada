import Drawer from '@/components/drawer';
import { CSSProperties, useEffect, useState } from 'react';
import e, { EventType } from '../eventemitter';
import { User } from '../constants';
import { ZIndex } from '../../../constants';
import UserEdit from './user_edit';

const maskProps: { style: CSSProperties } = {
  style: {
    zIndex: ZIndex.POPUP,
  },
};
const bodyProps: {
  style: CSSProperties;
} = {
  style: { width: 350, overflow: 'auto' },
};

function UserEditDrawer() {
  const [open, setOpen] = useState(false);
  const onClose = () => setOpen(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unlistenOpen = e.listen(EventType.OPEN_USER_EDIT_DRAWER, (data) => {
      setUser(data.user);
      return window.setTimeout(() => setOpen(true), 0);
    });
    return unlistenOpen;
  }, []);

  if (!user) {
    return null;
  }
  return (
    <Drawer
      open={open}
      onClose={onClose}
      maskProps={maskProps}
      bodyProps={bodyProps}
    >
      <UserEdit user={user} onClose={onClose} />
    </Drawer>
  );
}

export default UserEditDrawer;
