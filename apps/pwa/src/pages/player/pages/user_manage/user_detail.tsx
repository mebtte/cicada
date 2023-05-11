import styled from 'styled-components';
import Drawer from '@/components/drawer';
import { CSSProperties, useEffect, useState } from 'react';
import Input from '@/components/input';
import Textarea from '@/components/textarea';
import e, { EventType } from './eventemitter';
import { User } from './constants';
import { ZIndex } from '../../constants';

const Style = styled.div`
  > .part {
    margin: 20px;
  }
`;
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

function UserDetail() {
  const [open, setOpen] = useState(false);
  const onClose = () => setOpen(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unlistenOpen = e.listen(EventType.OPEN_USER_DETAIL, (data) => {
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
      <Style>
        <Input
          className="part"
          label="ID"
          inputProps={{ defaultValue: user.id, readOnly: true }}
        />
        <Input
          className="part"
          label="昵称"
          inputProps={{ defaultValue: user.nickname, readOnly: true }}
        />
        <Textarea
          className="part"
          label="备注"
          textareaProps={{ defaultValue: user.remark, rows: 5 }}
        />
      </Style>
    </Drawer>
  );
}

export default UserDetail;
