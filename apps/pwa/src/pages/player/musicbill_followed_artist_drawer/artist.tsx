import styled from 'styled-components';
import { CSSVariable } from '@/global_style';
import ellipsis from '@/style/ellipsis';
import Button from '@/components/button';
import { Tooltip } from '@/components';
import Cover, { CoverFallback, Shape } from '@/components/cover';
import dialog from '@/utils/dialog';
import logger from '@/utils/logger';
import removeMusicbillFollowedArtist from '@/server/api/remove_musicbill_followed_artist';
import getResizedImage from '@/server/asset/get_resized_image';
import { t } from '@/i18n';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../eventemitter';
import { Close } from '@/components/icon';
import ConsequenceList from './consequence_list';

const AVATAR_SIZE = 50;

const FONT = `'Nunito', 'Varela Round', system-ui, sans-serif`;
const NEUTRAL_SHADOW = CSSVariable.COLOR_NEUTRAL_SHADOW;

const Style = styled.div`
  margin: 0 0 12px;
  min-height: 76px;
  padding: 12px 14px;

  display: flex;
  align-items: center;
  gap: 10px;

  background: #fff;
  border: 2px solid ${NEUTRAL_SHADOW};
  border-radius: 16px;
  box-shadow: 0 3px 0 ${NEUTRAL_SHADOW};
  font-family: ${FONT};
  user-select: none;
  transition:
    transform 150ms ease-out,
    box-shadow 150ms ease-out;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 0 ${NEUTRAL_SHADOW};
  }

  &:active {
    transform: translateY(4px);
    box-shadow: none;
    transition:
      transform 60ms ease-in,
      box-shadow 60ms ease-in;
  }

  > .profile {
    flex: 1;
    min-width: 0;

    display: flex;
    align-items: center;
    gap: 12px;

    appearance: none;
    border: 0;
    background: transparent;
    color: inherit;
    text-align: left;
    cursor: pointer;
    padding: 0;

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

      > .name {
        color: rgb(50 50 50);
        font-size: ${CSSVariable.TEXT_SIZE_NORMAL};
        font-weight: 900;
        line-height: 1.2;
        ${ellipsis}
      }

      > .aliases {
        margin-top: 4px;
        color: ${CSSVariable.TEXT_COLOR_SECONDARY};
        font-size: ${CSSVariable.TEXT_SIZE_SMALL};
        ${ellipsis}
      }
    }
  }

  > .right {
    flex: 0 0 auto;
  }
`;
const RemoveIcon = styled(Close)`
  color: ${CSSVariable.COLOR_DANGEROUS};
`;

function Artist({
  artist,
  musicbillId,
  onChanged,
}: {
  artist: {
    id: string;
    name: string;
    aliases: string[];
    photos: { asset: string }[];
  };
  musicbillId: string;
  onChanged: () => void;
}) {
  const avatar = artist.photos[0]?.asset;
  return (
    <Style>
      <button
        type="button"
        className="profile"
        onClick={() =>
          playerEventemitter.emit(PlayerEventType.OPEN_ARTIST_DRAWER, {
            id: artist.id,
          })
        }
      >
        <div className="avatar-frame">
          <Cover
            className="avatar"
            size="100%"
            src={avatar ? getResizedImage({ url: avatar, size: AVATAR_SIZE * 2 }) : ''}
            fallbackVariant={CoverFallback.ARTIST}
            shape={Shape.SQUARE}
          />
        </div>
        <div className="main">
          <div className="name">{artist.name}</div>
          {artist.aliases.length ? (
            <div className="aliases">{artist.aliases.join(' / ')}</div>
          ) : null}
        </div>
      </button>
      <div className="right">
        <Tooltip content={t('unfollow_artist')}>
          <Button
            square
            variant="ghost"
            size="sm"
            icon={<RemoveIcon />}
            aria-label={t('unfollow_artist')}
            onClick={() =>
              dialog.confirm({
                title: t('unfollow_artist_question', artist.name),
                content: (
                  <ConsequenceList>
                    <li>{t('unfollow_artist_consequence_1')}</li>
                    <li>{t('unfollow_artist_consequence_2')}</li>
                  </ConsequenceList>
                ),
                confirmVariant: 'danger',
                onConfirm: async () => {
                  try {
                    await removeMusicbillFollowedArtist({
                      musicbillId,
                      artistId: artist.id,
                    });
                    onChanged();
                  } catch (error) {
                    logger.error(error, 'Failed to unfollow artist');
                    dialog.alert({ content: error.message });
                    return false;
                  }
                },
              })
            }
          />
        </Tooltip>
      </div>
    </Style>
  );
}

export default Artist;
