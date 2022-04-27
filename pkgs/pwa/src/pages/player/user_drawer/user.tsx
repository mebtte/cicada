import React from 'react';

import Avatar, { Shape } from '@/components/avatar';
import { MUSICBILL_COVER_SIZE, User as UserType } from './constants';
import Container from './container';
import MusicbillList from './musicbill_list';

const User = ({
  user,
  style,
  onCloseDrawer,
}: {
  user: UserType;
  style: unknown;
  onCloseDrawer: () => void;
}) => (
  <Container style={style}>
    <div className="top">
      <Avatar
        animated
        src={user.avatar}
        size={MUSICBILL_COVER_SIZE}
        shape={Shape.CIRCLE}
      />
      <div className="info">
        <div className="name">{user.nickname}</div>
        <div className="join-time">于 {user.joinTimeString} 加入</div>
        {user.condition ? (
          <div className="condition" title={user.condition}>
            {user.condition}
          </div>
        ) : null}
      </div>
    </div>
    <MusicbillList
      musicbillList={user.musicbillList}
      onCloseDrawer={onCloseDrawer}
    />
  </Container>
);

export default User;
