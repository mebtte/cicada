import styled, { css } from 'styled-components';
import IconButton from '#/components/icon_button';
import { MdPlaylistAdd, MdRefresh, MdOutlineEditNote } from 'react-icons/md';
import p from '@/global_states/profile';
import e, { EventType } from '../eventemitter';
import { MINI_INFO_HEIGHT, SingerDetail } from './constants';

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
  reload,
  singer,
}: {
  sticky: boolean;
  reload: () => void;
  singer: SingerDetail;
}) {
  const profile = p.useState()!;
  return (
    <Style sticky={sticky}>
      <IconButton
        onClick={() =>
          e.emit(EventType.ACTION_ADD_MUSIC_LIST_TO_PLAYLIST, {
            musicList: singer.musicList.map((m) => m.music),
          })
        }
      >
        <MdPlaylistAdd />
      </IconButton>
      <IconButton onClick={reload}>
        <MdRefresh />
      </IconButton>
      {profile.super || profile.id === singer.createUser.id ? (
        <IconButton>
          <MdOutlineEditNote />
        </IconButton>
      ) : null}
    </Style>
  );
}

export default Toolbar;
