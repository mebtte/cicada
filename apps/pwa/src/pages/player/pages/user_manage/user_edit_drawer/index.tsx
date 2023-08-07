import Drawer from '@/components/drawer';
import { CSSProperties, useEffect, useState } from 'react';
import styled from 'styled-components';
import autoScrollbar from '@/style/auto_scrollbar';
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
  style: { width: 350 },
};
const Content = styled.div`
  height: 100%;

  overflow: auto;
  ${autoScrollbar}
`;

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
      <Content>
        <UserEdit user={user} onClose={onClose} />
      </Content>
    </Drawer>
  );
}

export default UserEditDrawer;
