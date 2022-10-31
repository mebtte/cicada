import styled from 'styled-components';
import IconButton from '#/components/icon_button';
import {
  MdPlayArrow,
  MdOutlineEditNote,
  MdReadMore,
  MdMoreVert,
  MdOutlinePostAdd,
  MdPlaylistAdd,
} from 'react-icons/md';
import p from '@/global_states/profile';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../eventemitter';
import { MINI_INFO_HEIGHT, MusicDetail } from './constants';
import e, { EventType } from './eventemitter';

const Style = styled.div`
  position: sticky;
  top: ${MINI_INFO_HEIGHT}px;
  height: 45px;
  padding: 0 20px;

  display: flex;
  align-items: center;
  gap: 5px;

  backdrop-filter: blur(5px);
`;

function Toolbar({ music }: { music: MusicDetail }) {
  const profile = p.useState()!;
  return (
    <Style>
      <IconButton
        onClick={() =>
          playerEventemitter.emit(PlayerEventType.ACTION_PLAY_MUSIC, { music })
        }
      >
        <MdPlayArrow />
      </IconButton>
      <IconButton
        onClick={() =>
          playerEventemitter.emit(
            PlayerEventType.ACTION_INSERT_MUSIC_TO_PLAYQUEUE,
            {
              music,
            },
          )
        }
      >
        <MdReadMore />
      </IconButton>
      <IconButton
        onClick={() =>
          playerEventemitter.emit(PlayerEventType.OPEN_MUSICBILL_LIST_DRAWER, {
            music,
          })
        }
      >
        <MdPlaylistAdd />
      </IconButton>
      <IconButton
        onClick={() =>
          playerEventemitter.emit(PlayerEventType.OPEN_MUSICBILL_LIST_DRAWER, {
            music,
          })
        }
      >
        <MdOutlinePostAdd />
      </IconButton>
      {profile.super || profile.id === music.createUser.id ? (
        <IconButton onClick={() => e.emit(EventType.OPEN_EDIT_MENU, null)}>
          <MdOutlineEditNote />
        </IconButton>
      ) : null}
      <IconButton
        onClick={() =>
          playerEventemitter.emit(PlayerEventType.OPEN_MUSIC_OPERATE_POPUP, {
            music,
          })
        }
      >
        <MdMoreVert />
      </IconButton>
    </Style>
  );
}

export default Toolbar;
