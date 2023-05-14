import day from '#/utils/day';
import { MINI_MODE_MAX_WIDTH } from '@/constants';
import { CSSVariable } from '@/global_style';
import ellipsis from '@/style/ellipsis';
import styled from 'styled-components';
import Cover from '@/components/cover';
import IconButton from '@/components/icon_button';
import { MdMoreVert } from 'react-icons/md';
import { ComponentSize } from '@/constants/style';
import { User as UserType } from '../constants';
import { GAP } from './constants';
import e, { EventType } from '../eventemitter';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../../eventemitter';

const SIZE = 190;
const Style = styled.div`
  > .content {
    padding-bottom: 100%;
    position: relative;

    cursor: pointer;

    > .avatar {
      position: absolute;
      top: ${GAP / 2}px;
      left: ${GAP / 2}px;
    }

    > .bottom {
      position: absolute;
      bottom: ${GAP / 2}px;
      left: ${GAP / 2}px;
      width: calc(100% - ${GAP}px);

      padding: 5px;
      background-color: rgba(255, 255, 255, 0.75);

      display: flex;
      align-items: center;

      > .info {
        flex: 1;
        min-width: 0;

        > .nickname {
          font-size: 14px;
          color: ${CSSVariable.TEXT_COLOR_PRIMARY};
          ${ellipsis}
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

    > .admin {
      position: absolute;
      top: ${GAP / 2}px;
      left: ${GAP / 2}px;

      background-color: ${CSSVariable.COLOR_PRIMARY};
      color: #fff;
      font-size: 12px;
      padding: 2px 5px;
    }
  }

  width: ${SIZE}px;

  ${new Array(Math.ceil(MINI_MODE_MAX_WIDTH / SIZE / 2))
    .fill(0)
    .map(
      (_, index) => `
        @media (min-width: ${SIZE * (index + 1) + 1}px) and (max-width: ${
        SIZE * (index + 2)
      }px) {
          width: ${100 / (1 + index)}%;
        }
      `,
    )
    .join('\n')}
`;

function User({ user }: { user: UserType }) {
  const today = day();
  const yesterday = day().subtract(1, 'D');
  const lastActiveTime = day(user.lastActiveTimestamp);
  return (
    <Style
      onClick={() =>
        playerEventemitter.emit(PlayerEventType.OPEN_USER_DRAWER, {
          id: user.id,
        })
      }
    >
      <div className="content">
        <Cover
          className="avatar"
          src={user.avatar}
          size={`calc(100% - ${GAP}px)`}
        />
        <div className="bottom">
          <div className="info">
            <div className="nickname" title={user.nickname}>
              {user.nickname}
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

        {user.admin ? <div className="admin">管理员</div> : null}
      </div>
    </Style>
  );
}

export default User;
