import { CSSVariable } from '@/global_style';
import styled from 'styled-components';
import day from '#/utils/day';
import IconButton from '@/components/icon_button';
import { MdMoreVert } from 'react-icons/md';
import { User as UserType } from '../constants';
import Row from './row';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../../eventemitter';
import e, { EventType } from '../eventemitter';

const StyledRow = styled(Row)`
  cursor: pointer;

  &:hover {
    background-color: ${CSSVariable.BACKGROUND_COLOR_LEVEL_ONE};
  }
`;
const Avatar = styled.img`
  width: 36px;
  height: 36px;
  object-fix: cover;
`;
const Primary = styled.div`
  font-size: 14px;
  color: ${CSSVariable.TEXT_COLOR_PRIMARY};
  word-break: break-word;

  &.monospace {
    font-family: monospace;
  }
`;

function User({ user }: { user: UserType }) {
  const lastActiveTime = day(user.lastActiveTimestamp);
  const today = day();
  const yesterday = today.subtract(1, 'D');
  return (
    <StyledRow
      avatar={<Avatar src={user.avatar} crossOrigin="anonymous" />}
      nickname={<Primary>{user.nickname}</Primary>}
      id={<Primary className="monospace">{user.id}</Primary>}
      email={<Primary className="monospace">{user.email}</Primary>}
      lastActiveTime={
        user.lastActiveTimestamp ? (
          <Primary className="monospace">
            {lastActiveTime.isSame(today, 'D')
              ? '今天'
              : lastActiveTime.isSame(yesterday, 'D')
              ? '昨天'
              : lastActiveTime.format('YYYY-MM-DD')}
          </Primary>
        ) : null
      }
      joinTime={
        <Primary className="monospace">
          {day(user.joinTimestamp).format('YYYY-MM-DD')}
        </Primary>
      }
      musicbillMaxAmount={
        <Primary>{user.musicbillMaxAmount || '无限制'}</Primary>
      }
      createMusicMaxAmountPerDay={
        <Primary>{user.createMusicMaxAmountPerDay || '无限制'}</Primary>
      }
      exportMusicbillMaxTimePerDay={
        <Primary>{user.exportMusicbillMaxTimePerDay || '无限制'}</Primary>
      }
      remark={<Primary>{user.remark}</Primary>}
      more={
        <IconButton
          onClick={(event) => {
            event.stopPropagation();
            return e.emit(EventType.OPEN_EDIT_MENU, { user });
          }}
        >
          <MdMoreVert />
        </IconButton>
      }
      onClick={() =>
        playerEventemitter.emit(PlayerEventType.OPEN_USER_DRAWER, {
          id: user.id,
        })
      }
      onContextMenu={(event) => {
        event.preventDefault();
        return e.emit(EventType.OPEN_EDIT_MENU, { user });
      }}
    />
  );
}

export default User;
