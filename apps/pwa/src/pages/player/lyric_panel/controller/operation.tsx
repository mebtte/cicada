import styled from 'styled-components';
import Button from '@/components/button';
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
  gap: clamp(4px, 2vw, 12px);

  > button {
    flex: 0 0 auto;
  }
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
  loading,
}: {
  queueMusic: QueueMusic;
  paused: boolean;
  loading: boolean;
}) {
  return (
    <Style>
      <Button
        square
        variant="ghost"
        size="sm"
        onClick={() =>
          playerEventemitter.emit(PlayerEventType.OPEN_MUSICBILL_MUSIC_DRAWER, {
            music: queueMusic,
          })
        }
      >
        <MdOutlinePostAdd />
      </Button>
      <Button
        square
        variant="ghost"
        size="sm"
        onClick={() =>
          playerEventemitter.emit(
            PlayerEventType.ACTION_INSERT_MUSIC_TO_PLAYQUEUE,
            { music: queueMusic },
          )
        }
      >
        <MdReadMore />
      </Button>
      <Button square variant="ghost" size="sm" onClick={onPrevious}>
        <MdSkipPrevious />
      </Button>
      <Button
        square
        variant="primary"
        size="lg"
        onClick={paused ? onPlay : onPause}
        loading={loading}
      >
        {paused ? <MdPlayArrow /> : <MdPause />}
      </Button>
      <Button square variant="ghost" size="sm" onClick={onNext}>
        <MdSkipNext />
      </Button>
      <Button
        square
        variant="ghost"
        size="sm"
        onClick={openPlaylistPlayqueueDrawer}
      >
        <MdOutlineQueueMusic />
      </Button>
      <Button square variant="ghost" size="sm" onClick={closeLyricPanel}>
        <MdUnfoldLess />
      </Button>
    </Style>
  );
}

export default Operation;
