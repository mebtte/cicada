import styled from 'styled-components';
import IconButton from '#/components/icon_button';
import { MdPlaylistAdd, MdStar } from 'react-icons/md';
import notice from '#/utils/notice';
import { MINI_INFO_HEIGHT, Musicbill } from './constants';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../eventemitter';

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

function Toolbar({ musicbill }: { musicbill: Musicbill }) {
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
      <IconButton onClick={() => notice.info('todo')}>
        <MdStar />
      </IconButton>
    </Style>
  );
}

export default Toolbar;
