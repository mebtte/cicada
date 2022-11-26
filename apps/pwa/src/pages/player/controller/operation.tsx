import styled from 'styled-components';
import IconButton from '#/components/icon_button';
import {
  MdOutlineQueueMusic,
  MdPause,
  MdOutlinePlayArrow,
  MdOutlineSkipPrevious,
  MdOutlineSkipNext,
  MdMoreHoriz,
} from 'react-icons/md';
import mm from '@/global_states/mini_mode';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../eventemitter';
import { QueueMusic } from '../constants';

const openPlaylistPlayqueueDrawer = () =>
  playerEventemitter.emit(PlayerEventType.OPEN_PLAYLIST_PLAYQUEUE_DRAWER, null);
const onPlay = () => playerEventemitter.emit(PlayerEventType.ACTION_PLAY, null);
const onPause = () =>
  playerEventemitter.emit(PlayerEventType.ACTION_PAUSE, null);
const onPrevious = () =>
  playerEventemitter.emit(PlayerEventType.ACTION_PREVIOUS, null);
const onNext = () => playerEventemitter.emit(PlayerEventType.ACTION_NEXT, null);

const Style = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

function Operation({
  queueMusic,
  paused,
  loading,
}: {
  queueMusic: QueueMusic;
  paused: boolean;
  loading: boolean;
}) {
  const miniMode = mm.useState();
  return (
    <Style>
      {miniMode ? null : (
        <IconButton
          onClick={() =>
            playerEventemitter.emit(PlayerEventType.OPEN_MUSIC_OPERATE_POPUP, {
              music: queueMusic,
            })
          }
        >
          <MdMoreHoriz />
        </IconButton>
      )}
      <IconButton onClick={openPlaylistPlayqueueDrawer}>
        <MdOutlineQueueMusic />
      </IconButton>
      <IconButton onClick={onPrevious}>
        <MdOutlineSkipPrevious />
      </IconButton>
      <IconButton onClick={paused ? onPlay : onPause} loading={loading}>
        {paused ? <MdOutlinePlayArrow /> : <MdPause />}
      </IconButton>
      <IconButton onClick={onNext}>
        <MdOutlineSkipNext />
      </IconButton>
    </Style>
  );
}

export default Operation;
