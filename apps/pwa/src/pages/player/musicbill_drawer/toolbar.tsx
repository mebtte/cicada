import styled from 'styled-components';
import Button from '@/components/button';
import { MdPlaylistAdd, MdStar, MdStarOutline } from 'react-icons/md';
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

  position: ${({ $floatingControllerOffset }) =>
    $floatingControllerOffset ? 'absolute' : 'sticky'};
  left: ${({ $floatingControllerOffset }) =>
    $floatingControllerOffset ? 0 : 'auto'};
  right: ${({ $floatingControllerOffset }) =>
    $floatingControllerOffset ? 0 : 'auto'};
  bottom: ${({ $floatingControllerOffset }) =>
    $floatingControllerOffset ? CONTROLLER_FLOATING_RESERVED_HEIGHT : 0};
  flex-shrink: 0;
  height: calc(64px + env(safe-area-inset-bottom, 0));
  padding: 10px 20px calc(14px + env(safe-area-inset-bottom, 0)) 20px;

  display: flex;
  align-items: center;
  gap: 10px;

  background: rgb(255 255 255 / 0.9);
  border-top: 2px solid rgb(229 229 229);
  backdrop-filter: blur(8px);

  > .left {
    flex: 1;
    min-width: 0;

    display: flex;
    align-items: center;
    gap: 10px;
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
  return (
    <Style $floatingControllerOffset={floatingControllerOffset}>
      <div className="left">
        <Button
          square
          variant="ghost"
          size="sm"
          aria-label={t('add_to_playlist')}
          onClick={() =>
            musicbill.musicList.length
              ? addMusicListToPlaylist(musicbill.musicList)
              : notice.error(t('no_music_in_musicbill'))
          }
        >
          <MdPlaylistAdd />
        </Button>
        <Button
          square
          variant={collected ? 'primary' : 'ghost'}
          size="sm"
          aria-label={t('public_musicbill_collection')}
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
          {collected ? <MdStar /> : <MdStarOutline />}
        </Button>
      </div>
    </Style>
  );
}

export default Toolbar;
