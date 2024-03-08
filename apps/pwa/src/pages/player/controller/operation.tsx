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
import theme from '@/global_states/theme';
import { CSSVariable } from '@/global_style';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../eventemitter';
import { QueueMusic } from '../constants';
import notice from '@/utils/notice';
import { t } from '@/i18n';

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

    margin: 0 10px;

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
  queueMusic?: QueueMusic;
  paused: boolean;
  loading: boolean;
}) {
  const { miniMode } = theme.useState();
  return (
    <Style>
      {miniMode ? null : (
        <>
          <IconButton
            onClick={() =>
              queueMusic
                ? playerEventemitter.emit(
                    PlayerEventType.ACTION_INSERT_MUSIC_TO_PLAYQUEUE,
                    { music: queueMusic },
                  )
                : notice.error(t('no_music_is_playing'))
            }
          >
            <MdReadMore />
          </IconButton>
          <IconButton
            onClick={() =>
              queueMusic
                ? playerEventemitter.emit(
                    PlayerEventType.OPEN_MUSICBILL_MUSIC_DRAWER,
                    { music: queueMusic },
                  )
                : notice.error(t('no_music_is_playing'))
            }
          >
            <MdOutlinePostAdd />
          </IconButton>
          <IconButton
            onClick={() =>
              queueMusic
                ? playerEventemitter.emit(PlayerEventType.OPEN_MUSIC_DRAWER, {
                    id: queueMusic.id,
                  })
                : notice.error(t('no_music_is_playing'))
            }
          >
            <MdMoreHoriz />
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
