import React from 'react';
import styled from 'styled-components';
import { useSelector, shallowEqual } from 'react-redux';
import { Link } from 'react-router-dom';

import Tooltip, { Placement } from '@/components/tooltip';
import IconButton, { Name } from '@/components/icon_button';
import { User } from '@/constants/user';
import Avatar from '@/components/avatar';
import globalEentemitter, { EventType } from '@/platform/global_eventemitter';
import { ROOT_PATH } from '@/constants/route';

const ACTION_SIZE = 24;
const Style = styled.div`
  z-index: 1;
  height: 45px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  box-shadow: 0 2px 2px #f6f6f6;
  gap: 20px;
  > .logo {
    display: flex;
    align-items: center;
    gap: 10px;
    > .icon {
      height: 28px;
    }
    > .text {
      height: 20px;
    }
  }
  > .blank {
    flex: 1;
    min-width: 0;
  }
`;
const avatarStyle = {
  cursor: 'pointer',
};
const openProfileDialog = () =>
  globalEentemitter.emit(EventType.OPEN_PROFILE_DIALOG);

const Header = () => {
  const user = useSelector(({ user: u }: { user: User }) => u, shallowEqual);
  return (
    <Style>
      <Link className="logo" to={ROOT_PATH.HOME}>
        <img className="icon" src="/logo.png" alt="logo" />
        <img className="text" src="/text_logo.png" alt="text logo" />
      </Link>
      <div className="blank" />
      <Tooltip title="播放器" placement={Placement.BOTTOM}>
        <Link to={ROOT_PATH.PLAYER}>
          <IconButton name={Name.MUSIC_FILL} size={ACTION_SIZE} />
        </Link>
      </Tooltip>
      <Avatar
        animated
        src={user.avatar}
        onClick={openProfileDialog}
        style={avatarStyle}
        size={28}
      />
    </Style>
  );
};

export default Header;
