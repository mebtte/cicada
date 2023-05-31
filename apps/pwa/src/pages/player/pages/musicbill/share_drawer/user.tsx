import styled from 'styled-components';
import Cover, { Shape } from '@/components/cover';
import { CSSVariable } from '@/global_style';
import ellipsis from '@/style/ellipsis';
import { MdPersonOutline, MdOutlineForwardToInbox } from 'react-icons/md';
import { MusicbillSharedUserStatus } from '#/constants';
import { User as UserType } from './constants';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../../eventemitter';

const Style = styled.div`
  padding: 5px 20px;

  display: flex;
  align-items: center;
  gap: 10px;

  user-select: none;
  cursor: pointer;

  > .nickname {
    flex: 1;
    min-width: 0;

    font-size: 14px;
    color: ${CSSVariable.TEXT_COLOR_PRIMARY};
    ${ellipsis}
  }

  > .status {
    color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  }

  &:hover {
    background-color: ${CSSVariable.BACKGROUND_COLOR_LEVEL_ONE};
  }

  &:active {
    background-color: ${CSSVariable.BACKGROUND_COLOR_LEVEL_TWO};
  }
`;

function User({ user, onClose }: { user: UserType; onClose: () => void }) {
  return (
    <Style
      onClick={() => {
        playerEventemitter.emit(PlayerEventType.OPEN_USER_DRAWER, {
          id: user.id,
        });
        return onClose();
      }}
    >
      <Cover size={24} src={user.avatar} shape={Shape.CIRCLE} />
      <div className="nickname">{user.nickname}</div>
      {user.status === MusicbillSharedUserStatus.OWNER ? (
        <MdPersonOutline className="status" title="所有者" />
      ) : null}
      {user.status === MusicbillSharedUserStatus.INVITED ? (
        <MdOutlineForwardToInbox className="status" title="已发送邀请" />
      ) : null}
    </Style>
  );
}

export default User;
