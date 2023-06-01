import styled from 'styled-components';
import IconButton from '@/components/icon_button';
import { MdPlaylistAdd, MdStar, MdStarOutline } from 'react-icons/md';
import notice from '@/utils/notice';
import collectPublicMusicbill from '@/server/api/collect_public_musicbill';
import logger from '@/utils/logger';
import uncollectPublicMusicbill from '@/server/api/uncollect_public_musicbill';
import { MINI_INFO_HEIGHT, Musicbill } from './constants';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../eventemitter';
import e, { EventType } from './eventemitter';

const Style = styled.div`
  z-index: 1;

  position: sticky;
  top: ${MINI_INFO_HEIGHT}px;
  padding: 5px 20px;

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
      <IconButton
        onClick={() =>
          musicbill.musicList.length
            ? playerEventemitter.emit(
                PlayerEventType.ACTION_ADD_MUSIC_LIST_TO_PLAYLIST,
                { musicList: musicbill.musicList },
              )
            : notice.error('乐单暂无音乐')
        }
      >
        <MdPlaylistAdd />
      </IconButton>
      <IconButton
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
      </IconButton>
    </Style>
  );
}

export default Toolbar;
