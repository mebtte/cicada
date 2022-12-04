import Cover from '@/components/cover';
import { CSSVariable } from '@/global_style';
import styled from 'styled-components';
import day from '#/utils/day';
import ellipsis from '@/style/ellipsis';
import IconButton from '@/components/icon_button';
import { MdMoreVert } from 'react-icons/md';
import { ComponentSize } from '@/constants/style';
import { User as UserType } from '../constants';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../../eventemitter';
import e, { EventType } from '../eventemitter';

const AVATAR_SIZE = 76;
const Style = styled.div`
  height: ${AVATAR_SIZE + 20}px;

  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 20px;

  transition: 300ms;
  cursor: pointer;

  > .cover-box {
    position: relative;

    > img {
      display: block;
    }

    > .admin {
      position: absolute;
      right: 0;
      top: 0;

      padding: 0 5px;

      font-size: 12px;
      color: white;
      background-color: ${CSSVariable.COLOR_PRIMARY};
    }
  }

  > .info {
    flex: 1;
    min-width: 0;

    > .nickname {
      color: ${CSSVariable.TEXT_COLOR_PRIMARY};
      font-size: 14px;
      ${ellipsis}
    }

    > .secondary {
      font-family: monospace;
      font-size: 12px;
      color: ${CSSVariable.TEXT_COLOR_SECONDARY};
      ${ellipsis}

      > .remark {
        margin-left: 10px;
      }
    }

    > .divider {
      margin: 5px 0;

      height: 1px;
      background-color: ${CSSVariable.BACKGROUND_COLOR_LEVEL_TWO};
    }
  }

  &:hover {
    background-color: ${CSSVariable.BACKGROUND_COLOR_LEVEL_ONE};
  }

  &:active {
    background-color: ${CSSVariable.BACKGROUND_COLOR_LEVEL_TWO};
  }
`;

function User({ user }: { user: UserType }) {
  const openEditMenu = () => e.emit(EventType.OPEN_EDIT_MENU, { user });
  return (
    <Style
      onContextMenu={(event) => {
        event.preventDefault();
        return openEditMenu();
      }}
      onClick={() =>
        playerEventemitter.emit(PlayerEventType.OPEN_USER_DRAWER, {
          id: user.id,
        })
      }
    >
      <div className="cover-box">
        <Cover src={user.avatar} size={AVATAR_SIZE} />
        {user.admin ? <div className="admin">管理员</div> : null}
      </div>
      <div className="info">
        <div className="nickname">{user.nickname}</div>
        <div className="secondary"> ID: {user.id}</div>
        <div className="secondary"> 邮箱: {user.email}</div>
        <div className="divider" />
        <div className="secondary">
          {day(user.joinTimestamp).format('YYYY-MM-DD')}
          {user.remark ? (
            <span className="remark">备注: {user.remark}</span>
          ) : null}
        </div>
      </div>
      <IconButton
        size={ComponentSize.SMALL}
        onClick={(event) => {
          event.stopPropagation();
          return openEditMenu();
        }}
      >
        <MdMoreVert />
      </IconButton>
    </Style>
  );
}

export default User;
