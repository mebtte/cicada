import styled from 'styled-components';
import Cover, { Shape } from '@/components/cover';
import { CSSVariable } from '@/global_style';
import ellipsis from '@/style/ellipsis';
import {
  MdOutlinePersonPin,
  MdOutlineForwardToInbox,
  MdClose,
} from 'react-icons/md';
import IconButton from '@/components/icon_button';
import { CSSProperties } from 'react';
import dialog from '@/utils/dialog';
import logger from '@/utils/logger';
import notice from '@/utils/notice';
import deleteMusicbillSharedUser from '@/server/api/delete_musicbill_shared_user';
import getResizedImage from '@/server/asset/get_resized_image';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../eventemitter';

const AVATAR_SIZE = 24;
const ACTION_SIZE = 24;
const statusStyle: CSSProperties = {
  width: ACTION_SIZE,
  color: CSSVariable.TEXT_COLOR_SECONDARY,
};
const Style = styled.div`
  padding: 10px 20px;

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

  > .actions {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  &:hover {
    background-color: ${CSSVariable.BACKGROUND_COLOR_LEVEL_ONE};
  }

  &:active {
    background-color: ${CSSVariable.BACKGROUND_COLOR_LEVEL_TWO};
  }
`;
const removeStyle: CSSProperties = {
  color: CSSVariable.COLOR_DANGEROUS,
};

function User({
  user,
  owner = false,
  accepted = false,
  deletable = false,
  musicbillId,
}: {
  user: { id: string; nickname: string; avatar: string };
  owner?: boolean;
  accepted?: boolean;
  deletable?: boolean;
  musicbillId: string;
}) {
  return (
    <Style
      onClick={() =>
        playerEventemitter.emit(PlayerEventType.OPEN_USER_DRAWER, {
          id: user.id,
        })
      }
    >
      <Cover
        size={AVATAR_SIZE}
        src={getResizedImage({ url: user.avatar, size: AVATAR_SIZE * 2 })}
        shape={Shape.CIRCLE}
      />
      <div className="nickname">{user.nickname}</div>
      <div className="actions">
        {owner ? (
          <MdOutlinePersonPin style={statusStyle} title="所有者" />
        ) : accepted ? null : (
          <MdOutlineForwardToInbox style={statusStyle} title="已发送邀请" />
        )}
        {deletable ? (
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
                    playerEventemitter.emit(PlayerEventType.RELOAD_MUSICBILL, {
                      id: musicbillId,
                      silence: true,
                    });
                  } catch (error) {
                    logger.error(error, '移除乐单共享用户失败');
                    notice.error(error.message);
                  }
                },
              });
            }}
          >
            <MdClose style={removeStyle} />
          </IconButton>
        ) : null}
      </div>
    </Style>
  );
}

export default User;
