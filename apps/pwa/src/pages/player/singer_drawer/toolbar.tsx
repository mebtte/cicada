import styled from 'styled-components';
import IconButton from '#/components/icon_button';
import { MdPlaylistAdd, MdEdit, MdCopyAll } from 'react-icons/md';
import p from '@/global_states/profile';
import notice from '#/utils/notice';
import logger from '#/utils/logger';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../eventemitter';
import { MINI_INFO_HEIGHT, SingerDetail } from './constants';
import e, { EventType } from './eventemitter';

const openEditMenu = () => e.emit(EventType.OPEN_EDIT_MENU, null);
const Style = styled.div`
  z-index: 1;

  position: sticky;
  top: ${MINI_INFO_HEIGHT}px;
  padding: 5px 20px;

  display: flex;
  align-items: center;
  gap: 10px;

  backdrop-filter: blur(5px);

  > .left {
    flex: 1;
    min-width: 0;

    display: flex;
    align-items: center;
    gap: 5px;
  }
`;

function Toolbar({ singer }: { singer: SingerDetail }) {
  const profile = p.useState()!;
  return (
    <Style>
      <div className="left">
        <IconButton
          onClick={() =>
            singer.musicList.length
              ? playerEventemitter.emit(
                  PlayerEventType.ACTION_ADD_MUSIC_LIST_TO_PLAYLIST,
                  {
                    musicList: singer.musicList,
                  },
                )
              : notice.error('歌手暂未收录音乐')
          }
        >
          <MdPlaylistAdd />
        </IconButton>
        <IconButton
          onClick={() =>
            window.navigator.clipboard
              .writeText(singer.name)
              .then(() => notice.info('已复制歌手名字'))
              .catch((error) => {
                logger.error(error, '复制歌手名字失败');
                return notice.error(error.message);
              })
          }
        >
          <MdCopyAll />
        </IconButton>
      </div>
      {profile.admin || profile.id === singer.createUser.id ? (
        <IconButton onClick={openEditMenu}>
          <MdEdit />
        </IconButton>
      ) : null}
    </Style>
  );
}

export default Toolbar;
