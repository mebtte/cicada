import Cover from '#/components/cover';
import { CSSVariable } from '#/global_style';
import styled from 'styled-components';
import day from '#/utils/day';
import ellipsis from '#/style/ellipsis';
import IconButton from '#/components/icon_button';
import { MdMoreVert } from 'react-icons/md';
import { ComponentSize } from '#/constants/style';
import { User as UserType } from '../constants';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../../eventemitter';
import e, { EventType } from '../eventemitter';

const Style = styled.div`
  height: 80px;

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
      bottom: 0;

      padding: 0 5px;

      font-size: 12px;
      color: white;
      background-color: ${CSSVariable.COLOR_PRIMARY};
    }
  }

  > .info {
    flex: 1;
    min-width: 0;

    > .name {
      color: ${CSSVariable.TEXT_COLOR_SECONDARY};
      ${ellipsis}

      > .nickname {
        font-size: 14px;
        color: ${CSSVariable.TEXT_COLOR_PRIMARY};
      }

      > .email {
        font-size: 12px;
      }
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
        <Cover src={user.avatar} size={64} />
        {user.admin ? <div className="admin">管理员</div> : null}
      </div>
      <div className="info">
        <div className="secondary"> ID: {user.id}</div>
        <div className="name">
          <span className="nickname">{user.nickname}</span>
          <span className="email">「{user.email}」</span>
        </div>
        <div className="divider" />
        <div className="secondary">
          {day(user.joinTimestamp).format('YYYY-MM-DD HH:mm')}
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
