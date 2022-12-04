import styled, { css } from 'styled-components';
import IconButton from '@/components/icon_button';
import {
  MdOutlineQueueMusic,
  MdPause,
  MdPlayArrow,
  MdSkipPrevious,
  MdSkipNext,
  MdMoreHoriz,
  MdReadMore,
  MdOutlinePostAdd,
} from 'react-icons/md';
import mm from '@/global_states/mini_mode';
import { CSSVariable } from '@/global_style';
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

  > .divider {
    height: 24px;
    width: 1px;

    margin: 0 5px;

    background-color: ${CSSVariable.COLOR_BORDER};
  }

  ${({ theme: { miniMode } }) => css`
    gap: ${miniMode ? 5 : 10}px;
  `}
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
        <>
          <IconButton
            onClick={() =>
              playerEventemitter.emit(
                PlayerEventType.OPEN_MUSIC_OPERATE_POPUP,
                {
                  music: queueMusic,
                },
              )
            }
          >
            <MdMoreHoriz />
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
          <div className="divider" />
        </>
      )}
      <IconButton onClick={openPlaylistPlayqueueDrawer}>
        <MdOutlineQueueMusic />
      </IconButton>
      {miniMode ? null : (
        <IconButton onClick={onPrevious}>
          <MdSkipPrevious />
        </IconButton>
      )}
      <IconButton onClick={paused ? onPlay : onPause} loading={loading}>
        {paused ? <MdPlayArrow /> : <MdPause />}
      </IconButton>
      <IconButton onClick={onNext}>
        <MdSkipNext />
      </IconButton>
    </Style>
  );
}

export default Operation;
