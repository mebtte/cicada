import styled from 'styled-components';
import IconButton from '#/components/icon_button';
import { MdPlaylistAdd, MdEdit } from 'react-icons/md';
import p from '@/global_states/profile';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../eventemitter';
import { MINI_INFO_HEIGHT, SingerDetail } from './constants';
import e, { EventType } from './eventemitter';

const openEditMenu = () => e.emit(EventType.OPEN_EDIT_MENU, null);
const Style = styled.div`
  position: sticky;
  top: ${MINI_INFO_HEIGHT}px;
  height: 45px;
  padding: 0 20px;

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
            playerEventemitter.emit(
              PlayerEventType.ACTION_ADD_MUSIC_LIST_TO_PLAYLIST,
              {
                musicList: singer.musicList.map((m) => m.music),
              },
            )
          }
        >
          <MdPlaylistAdd />
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
