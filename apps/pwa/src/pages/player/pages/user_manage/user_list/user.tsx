import day from '#/utils/day';
import { CSSVariable } from '@/global_style';
import ellipsis from '@/style/ellipsis';
import styled from 'styled-components';
import Cover from '@/components/cover';
import IconButton from '@/components/icon_button';
import { MdMoreVert } from 'react-icons/md';
import { ComponentSize } from '@/constants/style';
import getResizedImage from '@/server/asset/get_resized_image';
import { User as UserType } from '../constants';
import e, { EventType } from '../eventemitter';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../../eventemitter';
import { GAP, ITEM_MIN_WIDTH } from './constants';

const Style = styled.div`
  display: inline-block;
  padding: ${GAP / 2}px;

  vertical-align: top;

  > .avatar-box {
    position: relative;

    cursor: pointer;

    > .admin {
      position: absolute;
      top: 0;
      left: 0;

      background-color: ${CSSVariable.COLOR_PRIMARY};
      color: #fff;
      font-size: 12px;
      padding: 2px 5px;
    }
  }

  > .bottom {
    margin-top: 5px;

    display: flex;
    align-items: center;

    > .info {
      flex: 1;
      min-width: 0;

      > .nickname {
        font-size: 14px;
        color: ${CSSVariable.TEXT_COLOR_PRIMARY};
        ${ellipsis}

        > span {
          cursor: pointer;
        }
      }

      > .last-active-time {
        font-size: 12px;
        color: ${CSSVariable.TEXT_COLOR_SECONDARY};
        font-family: monospace;

        > .icon {
          vertical-align: -2px;
        }
      }
    }
  }
`;

function User({ user, width }: { user: UserType; width: string }) {
  const today = day();
  const yesterday = day().subtract(1, 'D');
  const lastActiveTime = day(user.lastActiveTimestamp);

  const openUserDrawer = () =>
    playerEventemitter.emit(PlayerEventType.OPEN_USER_DRAWER, {
      id: user.id,
    });
  return (
    <Style style={{ width }}>
      <div className="avatar-box" onClick={openUserDrawer}>
        <Cover
          className="avatar"
          src={getResizedImage({ url: user.avatar, size: ITEM_MIN_WIDTH * 2 })}
          size="100%"
        />
        {user.admin ? <div className="admin">管理员</div> : null}
      </div>
      <div className="bottom">
        <div className="info">
          <div className="nickname" title={user.nickname}>
            <span onClick={openUserDrawer}>{user.nickname}</span>
          </div>
          <div className="last-active-time">
            上次活动&nbsp;
            {user.lastActiveTimestamp
              ? lastActiveTime.isSame(today, 'D')
                ? '今天'
                : lastActiveTime.isSame(yesterday, 'D')
                ? '昨天'
                : lastActiveTime.format('YYYY-MM-DD')
              : '未知'}
          </div>
        </div>
        <IconButton
          size={ComponentSize.SMALL}
          onClick={(event) => {
            event.stopPropagation();
            return e.emit(EventType.OPEN_USER_EDIT_DRAWER, { user });
          }}
        >
          <MdMoreVert />
        </IconButton>
      </div>
    </Style>
  );
}

export default User;
