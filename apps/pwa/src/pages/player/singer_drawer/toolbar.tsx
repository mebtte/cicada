import styled, { css } from 'styled-components';
import IconButton from '#/components/icon_button';
import { MdPlaylistAdd, MdOutlineEditNote } from 'react-icons/md';
import p from '@/global_states/profile';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../eventemitter';
import { MINI_INFO_HEIGHT, SingerDetail } from './constants';
import e, { EventType } from './eventemitter';

const openEditMenu = () => e.emit(EventType.OPEN_EDIT_MENU, null);
const Style = styled.div<{ sticky: boolean }>`
  position: sticky;
  top: ${MINI_INFO_HEIGHT}px;
  height: 45px;
  padding: 0 20px;

  display: flex;
  align-items: center;
  gap: 10px;

  background-color: #fff;
  border-bottom: 1px solid;

  ${({ sticky }) => css`
    border-color: ${sticky ? 'rgb(0 0 0 / 0.05)' : 'transparent'};
  `}
`;

function Toolbar({
  sticky,
  singer,
}: {
  sticky: boolean;
  singer: SingerDetail;
}) {
  const profile = p.useState()!;
  return (
    <Style sticky={sticky}>
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
      {profile.super || profile.id === singer.createUser.id ? (
        <IconButton onClick={openEditMenu}>
          <MdOutlineEditNote />
        </IconButton>
      ) : null}
    </Style>
  );
}

export default Toolbar;
