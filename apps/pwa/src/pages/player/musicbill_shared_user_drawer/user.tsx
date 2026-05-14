import styled from 'styled-components';
import Cover, { Shape } from '@/components/cover';
import { CSSVariable } from '@/global_style';
import ellipsis from '@/style/ellipsis';
import { MdClose } from 'react-icons/md';
import Button from '@/components/button';
import dialog from '@/utils/dialog';
import logger from '@/utils/logger';
import notice from '@/utils/notice';
import deleteMusicbillSharedUser from '@/server/api/delete_musicbill_shared_user';
import getResizedImage from '@/server/asset/get_resized_image';
import upperCaseFirstLetter from '@/utils/upper_case_first_letter';
import { t } from '@/i18n';
import { CSS_VAR } from '@/components/theme';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../eventemitter';

const AVATAR_SIZE = 50;
const PRIMARY = `var(${CSS_VAR.colorPrimary})`;
const FONT = `'Nunito', 'Varela Round', system-ui, sans-serif`;
const OWNER = 'rgb(255 200 0)';
const OWNER_SHADOW = 'rgb(224 168 0)';
const PENDING = 'rgb(99 209 250)';
const PENDING_SHADOW = 'rgb(72 179 220)';
const NEUTRAL_SHADOW = CSSVariable.COLOR_SURFACE_SHADOW;

const Style = styled.div<{ $owner: boolean; $accepted: boolean }>`
  margin: 0 0 12px;
  min-height: 76px;
  padding-right: 10px;

  position: relative;
  display: flex;
  align-items: center;

  background: #fff;
  border: 2px solid
    ${({ $owner, $accepted }) =>
      $owner ? OWNER : $accepted ? CSSVariable.COLOR_BORDER : PENDING};
  border-radius: 18px;
  box-shadow: 0 4px 0
    ${({ $owner, $accepted }) =>
      $owner ? OWNER_SHADOW : $accepted ? NEUTRAL_SHADOW : PENDING_SHADOW};
  font-family: ${FONT};
  user-select: none;
  overflow: hidden;
  transition:
    transform 150ms ease-out,
    box-shadow 150ms ease-out,
    filter 120ms ease-out;

  > .profile {
    flex: 1;
    min-width: 0;
    align-self: stretch;
    padding: 10px 2px 10px 12px;

    display: flex;
    align-items: center;
    gap: 12px;

    appearance: none;
    border: 0;
    background: transparent;
    color: inherit;
    text-align: left;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;

    > .avatar-frame {
      flex: 0 0 auto;
      width: ${AVATAR_SIZE}px;
      overflow: hidden;

      background: rgb(247 247 247);
      border: 2px solid ${CSSVariable.COLOR_BORDER};
      border-radius: 16px;
      box-shadow: 0 3px 0 ${NEUTRAL_SHADOW};

      > .avatar {
        display: block;
      }
    }

    > .main {
      flex: 1;
      min-width: 0;

      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 7px;

      > .nickname {
        color: rgb(50 50 50);
        font-size: ${CSSVariable.TEXT_SIZE_NORMAL};
        font-weight: 900;
        line-height: 1.2;
        ${ellipsis}
      }
    }

    &:focus-visible {
      outline: 3px solid ${PRIMARY};
      outline-offset: -5px;
      border-radius: 16px;
    }
  }

  > .remove {
    flex: 0 0 auto;
  }

  &:hover {
    filter: brightness(1.03);
  }

  &:active {
    transform: translateY(4px);
    box-shadow: none;
    transition:
      transform 60ms ease-in,
      box-shadow 60ms ease-in,
      filter 60ms ease-in;
  }
`;
const StatusBadge = styled.div<{ $type: 'owner' | 'pending' }>`
  width: fit-content;
  max-width: 100%;
  height: 24px;
  padding: 0 8px;

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;

  color: ${({ $type }) =>
    $type === 'owner'
      ? 'rgb(124 91 0)'
      : 'rgb(28 106 138)'};
  background: ${({ $type }) =>
    $type === 'owner'
      ? 'rgb(255 246 204)'
      : 'rgb(228 247 255)'};
  border: 2px solid
    ${({ $type }) => ($type === 'owner' ? OWNER : PENDING)};
  border-radius: 999px;
  box-shadow: 0 2px 0
    ${({ $type }) => ($type === 'owner' ? OWNER_SHADOW : PENDING_SHADOW)};

  font-size: 11px;
  font-weight: 900;
  line-height: 1;

  > svg {
    flex: 0 0 auto;
    font-size: 14px;
  }

  > span {
    min-width: 0;
    display: inline-flex;
    align-items: center;
    height: 100%;
    ${ellipsis}
  }
`;
const RemoveIcon = styled(MdClose)`
  color: ${CSSVariable.COLOR_DANGEROUS};
`;

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
  const status = owner ? 'owner' : 'pending';
  const statusText = owner ? t('owner') : t('invitation_has_sent');
  const showStatus = owner || !accepted;

  return (
    <Style $owner={owner} $accepted={accepted}>
      <button
        type="button"
        className="profile"
        onClick={() =>
          playerEventemitter.emit(PlayerEventType.OPEN_USER_DRAWER, {
            id: user.id,
          })
        }
      >
        <div className="avatar-frame">
          <Cover
            className="avatar"
            size="100%"
            src={getResizedImage({ url: user.avatar, size: AVATAR_SIZE * 2 })}
            shape={Shape.SQUARE}
          />
        </div>
        <div className="main">
          <div className="nickname">{user.nickname}</div>
          {showStatus ? (
            <StatusBadge
              $type={status}
              title={upperCaseFirstLetter(statusText)}
            >
              <span>{statusText}</span>
            </StatusBadge>
          ) : null}
        </div>
      </button>
      {deletable ? (
        <Button
          className="remove"
          square
          variant="ghost"
          size="sm"
          icon={<RemoveIcon />}
          aria-label={t('delete')}
          title={t('delete')}
          onClick={() =>
            dialog.confirm({
              content: t('remove_user_from_shared_musicbill_question'),
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
                  logger.error(
                    error,
                    'Failed to remove user from shared musicbill',
                  );
                  notice.error(error.message);
                }
              },
            })
          }
        />
      ) : null}
    </Style>
  );
}

export default User;
