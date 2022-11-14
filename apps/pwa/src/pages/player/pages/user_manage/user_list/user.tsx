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
  return (
    <Style
      onClick={() =>
        playerEventemitter.emit(PlayerEventType.OPEN_USER_DIALOG, {
          id: user.id,
        })
      }
    >
      <Cover src={user.avatar} size={64} />
      <div className="info">
        <div className="secondary"> ID: {user.id}</div>
        <div className="name">
          <span className="nickname">{user.nickname}</span>
          <span className="email">({user.email})</span>
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
          event.preventDefault();
          return e.emit(EventType.OPEN_EDIT_MENU, { user });
        }}
      >
        <MdMoreVert />
      </IconButton>
    </Style>
  );
}

export default User;
