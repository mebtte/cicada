import styled from 'styled-components';
import day from '@/utils/day';
import Button from '@/components/button';
import { CSSVariable } from '@/global_style';
import { useState } from 'react';
import acceptSharedMusicbillInvitation from '@/server/api/accept_shared_musicbill_invitation';
import logger from '@/utils/logger';
import notice from '@/utils/notice';
import useNavigate from '@/utils/use_navigate';
import { PLAYER_PATH, ROOT_PATH } from '@/constants/route';
import { t } from '@/i18n';
import {
  MdCheckCircle,
  MdSchedule,
} from 'react-icons/md';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../eventemitter';
import { Invitation as InvitationType } from './constants';

const USER_MARKER = '__INVITE_USER__';
const MUSICBILL_MARKER = '__INVITE_MUSICBILL__';
const FONT = `'Nunito', 'Varela Round', system-ui, sans-serif`;
const NEUTRAL_SHADOW = 'rgb(218 218 218)';

const Style = styled.article`
  padding: 14px 14px 16px;

  display: flex;
  flex-direction: column;
  gap: 12px;

  background: #fff;
  border: 2px solid ${CSSVariable.COLOR_BORDER};
  border-radius: 18px;
  box-shadow: 0 4px 0 ${NEUTRAL_SHADOW};
  font-family: ${FONT};
`;
const Top = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;
const TimeBadge = styled.div`
  height: 26px;
  padding: 0 9px;

  display: inline-flex;
  align-items: center;
  gap: 5px;

  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  font-size: ${CSSVariable.TEXT_SIZE_SMALL};
  font-weight: 900;
  line-height: 1;
  background: rgb(247 247 247);
  border: 2px solid rgb(232 232 232);
  border-radius: 999px;
  box-shadow: 0 2px 0 ${NEUTRAL_SHADOW};

  > svg {
    flex: 0 0 auto;
    font-size: 15px;
  }
`;
const Description = styled.div`
  color: rgb(50 50 50);
  font-size: ${CSSVariable.TEXT_SIZE_NORMAL};
  font-weight: 900;
  line-height: 1.45;
`;
const UserButton = styled.button`
  max-width: 100%;
  padding: 0;

  display: inline;

  color: ${CSSVariable.COLOR_PRIMARY};
  appearance: none;
  border: 0;
  background: transparent;
  font: inherit;
  font-weight: 900;
  cursor: pointer;
  vertical-align: baseline;

  &:focus-visible {
    outline: 3px solid ${CSSVariable.COLOR_PRIMARY};
    outline-offset: 2px;
    border-radius: 6px;
  }
`;
const MusicbillName = styled.span`
  color: rgb(28 106 138);
  text-decoration: underline;
  text-decoration-thickness: 2px;
  text-underline-offset: 3px;
`;
function InvitationText({
  inviteUserId,
  inviteUserNickname,
  musicbillName,
}: {
  inviteUserId: string;
  inviteUserNickname: string;
  musicbillName: string;
}) {
  const text = t(
    'shared_musicbill_invitation_instruction',
    USER_MARKER,
    MUSICBILL_MARKER,
  );
  const pieces = text.split(new RegExp(`(${USER_MARKER}|${MUSICBILL_MARKER})`));

  return (
    <Description>
      {pieces.map((piece, index) => {
        if (piece === USER_MARKER) {
          return (
            <UserButton
              key={`${piece}-${index}`}
              type="button"
              onClick={() =>
                playerEventemitter.emit(PlayerEventType.OPEN_USER_DRAWER, {
                  id: inviteUserId,
                })
              }
            >
              {inviteUserNickname}
            </UserButton>
          );
        }
        if (piece === MUSICBILL_MARKER) {
          return (
            <MusicbillName key={`${piece}-${index}`}>
              {musicbillName}
            </MusicbillName>
          );
        }
        return piece;
      })}
    </Description>
  );
}

function Invitation({
  invitation,
  onAccepted,
}: {
  invitation: InvitationType;
  onAccepted: () => void;
}) {
  const navigate = useNavigate();
  const {
    id,
    inviteUserId,
    inviteUserNickname,
    inviteTimestamp,
    musicbillId,
    musicbillName,
  } = invitation;
  const safeMusicbillName = musicbillName || t('musicbill');

  const [loading, setLoading] = useState(false);
  const onAccept = async () => {
    setLoading(true);
    try {
      await acceptSharedMusicbillInvitation(id);
      playerEventemitter.emit(PlayerEventType.RELOAD_MUSICBILL_LIST, {
        silence: true,
      });
      onAccepted();
      window.setTimeout(
        () =>
          navigate({
            path:
              ROOT_PATH.PLAYER +
              PLAYER_PATH.MUSICBILL.replace(':id', musicbillId),
          }),
        0,
      );
    } catch (error) {
      logger.error(error, 'Failed to accept invitation of shared musicbill');
      notice.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Style>
      <Top>
        <TimeBadge>
          <MdSchedule />
          <span>{day(inviteTimestamp).format('MM-DD HH:mm')}</span>
        </TimeBadge>
      </Top>
      <InvitationText
        inviteUserId={inviteUserId}
        inviteUserNickname={inviteUserNickname}
        musicbillName={safeMusicbillName}
      />
      <Button
        block
        icon={<MdCheckCircle />}
        onClick={onAccept}
        loading={loading}
      >
        {t('accept')}
      </Button>
    </Style>
  );
}

export default Invitation;
