import styled from 'styled-components';
import IconButton from '@/components/icon_button';
import {
  MdUnfoldLess,
  MdOutlineQueueMusic,
  MdSkipNext,
  MdSkipPrevious,
  MdPlayArrow,
  MdPause,
  MdOutlinePostAdd,
  MdReadMore,
} from 'react-icons/md';
import { flexCenter } from '@/style/flexbox';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../eventemitter';
import { QueueMusic } from '../../constants';

const Style = styled.div`
  ${flexCenter}
  gap: 15px;
`;
const closeLyricPanel = () =>
  playerEventemitter.emit(PlayerEventType.TOGGLE_LYRIC_PANEL, { open: false });
const openPlaylistPlayqueueDrawer = () =>
  playerEventemitter.emit(PlayerEventType.OPEN_PLAYLIST_PLAYQUEUE_DRAWER, null);
const onPlay = () => playerEventemitter.emit(PlayerEventType.ACTION_PLAY, null);
const onPause = () =>
  playerEventemitter.emit(PlayerEventType.ACTION_PAUSE, null);
const onPrevious = () =>
  playerEventemitter.emit(PlayerEventType.ACTION_PREVIOUS, null);
const onNext = () => playerEventemitter.emit(PlayerEventType.ACTION_NEXT, null);

function Operation({
  queueMusic,
  paused,
}: {
  queueMusic: QueueMusic;
  paused: boolean;
}) {
  return (
    <Style>
      <IconButton
        onClick={() =>
          playerEventemitter.emit(
            PlayerEventType.OPEN_ADD_MUSIC_TO_MUSICBILL_DRAWER,
            { music: queueMusic },
          )
        }
      >
        <MdOutlinePostAdd />
      </IconButton>
      <IconButton
        onClick={() =>
          playerEventemitter.emit(
            PlayerEventType.ACTION_INSERT_MUSIC_TO_PLAYQUEUE,
            { music: queueMusic },
          )
        }
      >
        <MdReadMore />
      </IconButton>
      <IconButton onClick={onPrevious}>
        <MdSkipPrevious />
      </IconButton>
      <IconButton onClick={paused ? onPlay : onPause} size={56}>
        {paused ? <MdPlayArrow /> : <MdPause />}
      </IconButton>
      <IconButton onClick={onNext}>
        <MdSkipNext />
      </IconButton>
      <IconButton onClick={openPlaylistPlayqueueDrawer}>
        <MdOutlineQueueMusic />
      </IconButton>
      <IconButton onClick={closeLyricPanel}>
        <MdUnfoldLess />
      </IconButton>
    </Style>
  );
}

export default Operation;
