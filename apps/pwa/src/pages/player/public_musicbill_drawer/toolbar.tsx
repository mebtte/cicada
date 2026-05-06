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
import e, { EventType } from './eventemitter';
import addMusicListToPlaylist from '../add_to_playlist';

const Style = styled.div`
  position: sticky;
  bottom: 0;
  height: calc(50px + env(safe-area-inset-bottom, 0));
  padding: 0 20px env(safe-area-inset-bottom, 0) 20px;

  display: flex;
  align-items: center;
  gap: 5px;

  backdrop-filter: blur(5px);
`;

function Toolbar({
  musicbill,
  collected,
}: {
  musicbill: Musicbill;
  collected: boolean;
}) {
  return (
    <Style>
      <Button
        square
        variant="plain"
        size="sm"
        onClick={(event) =>
          musicbill.musicList.length
            ? addMusicListToPlaylist(musicbill.musicList, event.currentTarget)
            : notice.error(t('no_music_in_musicbill'))
        }
      >
        <MdPlaylistAdd />
      </Button>
      <Button
        square
        variant="plain"
        size="sm"
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
    </Style>
  );
}

export default Toolbar;
