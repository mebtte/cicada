import styled from 'styled-components';
import Button from '@/components/button';
import { Tooltip } from '@/components';
import { PlaylistAdd, StarFilled, Star } from '@/components/icon';
import { CSSVariable } from '@/global_style';
import notice from '@/utils/notice';
import collectPublicMusicbill from '@/server/api/collect_public_musicbill';
import logger from '@/utils/logger';
import uncollectPublicMusicbill from '@/server/api/uncollect_public_musicbill';
import { t } from '@/i18n';
import { Musicbill } from './constants';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../eventemitter';
import { CONTROLLER_FLOATING_RESERVED_HEIGHT } from '../constants';
import e, { EventType } from './eventemitter';
import addMusicListToPlaylist from '../add_to_playlist';

const Style = styled.div<{ $floatingControllerOffset: boolean }>`
  z-index: 1;

  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  bottom: ${({ $floatingControllerOffset }) =>
    $floatingControllerOffset
      ? CONTROLLER_FLOATING_RESERVED_HEIGHT
      : 'calc(14px + env(safe-area-inset-bottom, 0))'};
  max-width: calc(100% - 32px);
  padding: 8px 12px;
  box-sizing: border-box;

  display: flex;
  align-items: center;
  gap: 8px;

  background: rgb(255 255 255 / 0.92);
  border: 2px solid ${CSSVariable.COLOR_NEUTRAL_SHADOW};
  border-radius: 16px;
  box-shadow:
    0 4px 0 ${CSSVariable.COLOR_NEUTRAL_SHADOW},
    0 10px 24px rgb(0 0 0 / 0.1);
  backdrop-filter: blur(12px);

  > .left {
    min-width: 0;

    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

function Toolbar({
  musicbill,
  collected,
  floatingControllerOffset = false,
}: {
  musicbill: Musicbill;
  collected: boolean;
  floatingControllerOffset?: boolean;
}) {
  const hasMusic = !!musicbill.musicList.length;

  return (
    <Style $floatingControllerOffset={floatingControllerOffset}>
      <div className="left">
        <Tooltip content={t('add_to_playlist')}>
          <Button
            square
            variant="ghost"
            size="sm"
            aria-label={t('add_to_playlist')}
            disabled={!hasMusic}
            onClick={() => {
              if (!hasMusic) {
                return;
              }

              addMusicListToPlaylist(musicbill.musicList);
            }}
          >
            <PlaylistAdd />
          </Button>
        </Tooltip>
        <Tooltip
          content={collected ? t('uncollect_musicbill') : t('collect_musicbill')}
        >
          <Button
            square
            variant={collected ? 'primary' : 'ghost'}
            size="sm"
            aria-label={
              collected ? t('uncollect_musicbill') : t('collect_musicbill')
            }
            aria-pressed={collected}
            onClick={() => {
              if (collected) {
                e.emit(EventType.UNCOLLECT_MUSICBILL, { id: musicbill.id });
                uncollectPublicMusicbill(musicbill.id)
                  .then(() =>
                    playerEventemitter.emit(
                      PlayerEventType.MUSICBILL_COLLECTION_CHANGE,
                      null,
                    ),
                  )
                  .catch((error) => {
                    logger.error(error, '取消收藏乐单失败');
                    notice.error(error.message);
                    e.emit(EventType.COLLECT_MUSICBILL, { id: musicbill.id });
                  });
              } else {
                e.emit(EventType.COLLECT_MUSICBILL, {
                  id: musicbill.id,
                });
                collectPublicMusicbill(musicbill.id)
                  .then(() =>
                    playerEventemitter.emit(
                      PlayerEventType.MUSICBILL_COLLECTION_CHANGE,
                      null,
                    ),
                  )
                  .catch((error) => {
                    logger.error(error, '收藏乐单失败');
                    notice.error(error.message);
                    e.emit(EventType.UNCOLLECT_MUSICBILL, {
                      id: musicbill.id,
                    });
                  });
              }
            }}
          >
            {collected ? <StarFilled /> : <Star />}
          </Button>
        </Tooltip>
      </div>
    </Style>
  );
}

export default Toolbar;
