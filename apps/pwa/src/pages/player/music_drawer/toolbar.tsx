import styled, { css } from 'styled-components';
import IconButton from '#/components/icon_button';
import {
  MdPlayArrow,
  MdOutlineEditNote,
  MdHistory,
  MdReadMore,
  MdMoreVert,
  MdOutlinePostAdd,
  MdPlaylistAdd,
} from 'react-icons/md';
import p from '@/global_states/profile';
import e, { EventType } from '../eventemitter';
import { MINI_INFO_HEIGHT, MusicDetail } from './constants';

const Style = styled.div<{ sticky: boolean }>`
  position: sticky;
  top: ${MINI_INFO_HEIGHT}px;
  height: 45px;
  padding: 0 20px;

  display: flex;
  align-items: center;
  gap: 5px;

  background-color: #fff;
  border-bottom: 1px solid;

  ${({ sticky }) => css`
    border-color: ${sticky ? 'rgb(0 0 0 / 0.05)' : 'transparent'};
  `}
`;

function Toolbar({ sticky, music }: { sticky: boolean; music: MusicDetail }) {
  const profile = p.useState()!;
  return (
    <Style sticky={sticky}>
      <IconButton
        onClick={() => e.emit(EventType.ACTION_PLAY_MUSIC, { music })}
      >
        <MdPlayArrow />
      </IconButton>
      <IconButton
        onClick={() =>
          e.emit(EventType.ACTION_INSERT_MUSIC_TO_PLAYQUEUE, { music })
        }
      >
        <MdReadMore />
      </IconButton>
      <IconButton
        onClick={() => e.emit(EventType.OPEN_MUSICBILL_LIST_DRAWER, { music })}
      >
        <MdPlaylistAdd />
      </IconButton>
      <IconButton
        onClick={() => e.emit(EventType.OPEN_MUSICBILL_LIST_DRAWER, { music })}
      >
        <MdOutlinePostAdd />
      </IconButton>
      {profile.super || profile.id === music.createUser.id ? (
        <>
          <IconButton>
            <MdOutlineEditNote />
          </IconButton>
          <IconButton>
            <MdHistory />
          </IconButton>
        </>
      ) : null}
      <IconButton
        onClick={() =>
          e.emit(EventType.OPEN_MUSIC_OPERATE_POPUP, {
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
