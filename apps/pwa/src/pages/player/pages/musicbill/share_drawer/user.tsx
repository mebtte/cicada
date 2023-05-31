import styled from 'styled-components';
import Cover, { Shape } from '@/components/cover';
import { CSSVariable } from '@/global_style';
import ellipsis from '@/style/ellipsis';
import {
  MdOutlinePersonPin,
  MdOutlineForwardToInbox,
  MdDeleteOutline,
} from 'react-icons/md';
import { MusicbillSharedUserStatus } from '#/constants';
import IconButton from '@/components/icon_button';
import { CSSProperties } from 'react';
import dialog from '@/utils/dialog';
import logger from '@/utils/logger';
import notice from '@/utils/notice';
import deleteMusicbillSharedUser from '@/server/api/delete_musicbill_shared_user';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../../eventemitter';
import { User as UserType } from './constants';
import e, { EventType } from '../eventemitter';

const ACTION_SIZE = 24;
const statusStyle: CSSProperties = {
  width: ACTION_SIZE,
  color: CSSVariable.TEXT_COLOR_SECONDARY,
};
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

  &:hover {
    background-color: ${CSSVariable.BACKGROUND_COLOR_LEVEL_ONE};
  }

  &:active {
    background-color: ${CSSVariable.BACKGROUND_COLOR_LEVEL_TWO};
  }
`;

function User({
  user,
  onClose,
  owner,
  musicbillId,
}: {
  user: UserType;
  onClose: () => void;
  owner: boolean;
  musicbillId: string;
}) {
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
        <MdOutlinePersonPin style={statusStyle} title="所有者" />
      ) : user.status === MusicbillSharedUserStatus.INVITED ? (
        <MdOutlineForwardToInbox style={statusStyle} title="已发送邀请" />
      ) : null}
      {owner && user.status !== MusicbillSharedUserStatus.OWNER ? (
        <IconButton
          size={ACTION_SIZE}
          onClick={(event) => {
            event.stopPropagation();
            return dialog.confirm({
              title: '确定从共享名单中移除吗?',
              onConfirm: async () => {
                try {
                  await deleteMusicbillSharedUser({
                    musicbillId,
                    userId: user.id,
                  });
                  e.emit(EventType.RELOAD_SHARED_USERS, null);
                  playerEventemitter.emit(
                    PlayerEventType.FETCH_MUSICBILL_DETAIL,
                    { id: musicbillId, silence: true },
                  );
                } catch (error) {
                  logger.error(error, '移除乐单共享用户失败');
                  notice.error(error.message);
                }
              },
            });
          }}
        >
          <MdDeleteOutline />
        </IconButton>
      ) : null}
    </Style>
  );
}

export default User;
