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
import Slider from '@/components/slider';
import { CSSVariable } from '@/global_style';
import ellipsis from '@/style/ellipsis';
import { QueueMusic } from '../constants';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../eventemitter';
import useAudioCurrentMillisecond from '../use_audio_current_millisecond';
import Singer from '../components/singer';

const Style = styled.div`
  z-index: 2;

  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;

  padding: 10px 0 max(env(safe-area-inset-bottom, 0), 10px) 0;

  background-color: rgb(255 255 255 / 0.5);
  backdrop-filter: blur(10px);
  overflow: hidden;

  display: flex;
  flex-direction: column;
  gap: 10px;

  > .slider {
    margin: 0 20px;
  }

  > .info {
    margin: 0 20px;

    text-align: center;
    color: ${CSSVariable.TEXT_COLOR_PRIMARY};

    > .name {
      font-size: 20px;
      font-weight: bold;
      line-height: 1.8;
      ${ellipsis}

      >.content {
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
    }

    > .singers {
      font-size: 14px;
      ${ellipsis}
    }
  }

  > .operation {
    ${flexCenter}
    gap: 15px;
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

function Controller({
  queueMusic,
  paused,
  duration,
}: {
  queueMusic: QueueMusic;
  paused: boolean;
  duration: number;
}) {
  const onTimeChange = (p: number) =>
    playerEventemitter.emit(PlayerEventType.ACTION_SET_TIME, {
      second: duration * p,
    });

  const currentMillisecond = useAudioCurrentMillisecond();
  const percent = duration ? currentMillisecond / 1000 / duration : 0;
  return (
    <Style>
      <div className="info">
        <div className="name">
          <span
            className="content"
            onClick={() =>
              playerEventemitter.emit(PlayerEventType.OPEN_MUSIC_DRAWER, {
                id: queueMusic.id,
              })
            }
          >
            {queueMusic.name}
          </span>
        </div>
        <div className="singers">
          {queueMusic.singers.map((singer) => (
            <Singer key={singer.id} singer={singer} />
          ))}
        </div>
      </div>
      <Slider current={percent} onChange={onTimeChange} className="slider" />
      <div className="operation">
        <IconButton onClick={closeLyricPanel}>
          <MdUnfoldLess />
        </IconButton>
        <IconButton onClick={openPlaylistPlayqueueDrawer}>
          <MdOutlineQueueMusic />
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
      </div>
    </Style>
  );
}

export default Controller;
