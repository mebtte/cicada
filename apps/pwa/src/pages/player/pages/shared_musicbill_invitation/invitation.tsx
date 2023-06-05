import styled from 'styled-components';
import day from '#/utils/day';
import Button from '@/components/button';
import { CSSVariable } from '@/global_style';
import { useState } from 'react';
import acceptSharedMusicbillInvitation from '@/server/api/accept_shared_musicbill_invitation';
import logger from '@/utils/logger';
import notice from '@/utils/notice';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../eventemitter';
import { Invitation as InvitationType } from './constants';
import e, { EventType } from './eventemitter';

const Style = styled.div`
  padding: 10px 20px;

  > .time {
    font-size: 12px;
    color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  }

  > .description {
    margin: 5px 0;

    font-size: 14px;
    color: ${CSSVariable.TEXT_COLOR_PRIMARY};

    > .user {
      color: ${CSSVariable.COLOR_PRIMARY};
      cursor: pointer;
    }

    > .musicbill {
      text-decoration: underline;
    }
  }

  &:hover {
    background-color: ${CSSVariable.BACKGROUND_COLOR_LEVEL_ONE};
  }
`;

function Invitation({ invitation }: { invitation: InvitationType }) {
  const {
    id,
    inviteUserId,
    inviteUserNickname,
    shareTimestamp,
    musicbillName,
  } = invitation;

  const [loading, setLoading] = useState(false);
  const onAccept = async () => {
    setLoading(true);
    try {
      await acceptSharedMusicbillInvitation(id);
      playerEventemitter.emit(PlayerEventType.RELOAD_MUSICBILL_LIST, null);
      window.setTimeout(() => e.emit(EventType.INVITATION_ACCEPTED, { id }));
    } catch (error) {
      logger.error(error, '接受共享乐单邀请失败');
      notice.error(error.message);
    }
    setLoading(false);
  };

  return (
    <Style>
      <div className="time">{day(shareTimestamp).format('MM-DD HH:mm')}</div>
      <div className="description">
        <span
          className="user"
          onClick={() =>
            playerEventemitter.emit(PlayerEventType.OPEN_USER_DRAWER, {
              id: inviteUserId,
            })
          }
        >
          {inviteUserNickname}
        </span>
        &nbsp; 邀请你共享乐单 &nbsp;
        <span className="musicbill">{musicbillName}</span>
      </div>
      <div className="actions">
        <Button onClick={onAccept} loading={loading}>
          接受
        </Button>
      </div>
    </Style>
  );
}

export default Invitation;
