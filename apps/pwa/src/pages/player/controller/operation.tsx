import styled, { css } from 'styled-components';
import Button from '@/components/button';
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
import { CSSVariable } from '@/global_style';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../eventemitter';
import { QueueMusic } from '../constants';
import notice from '@/utils/notice';
import { t } from '@/i18n';
import { useTheme } from '@/global_states/theme';

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
  const { miniMode } = useTheme();
  return (
    <Style>
      {miniMode ? null : (
        <>
          <Button
            square
            variant="ghost"
            size="sm"
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
          </Button>
          <Button
            square
            variant="ghost"
            size="sm"
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
          </Button>
          <Button
            square
            variant="ghost"
            size="sm"
            onClick={() =>
              queueMusic
                ? playerEventemitter.emit(PlayerEventType.OPEN_MUSIC_DRAWER, {
                    id: queueMusic.id,
                  })
                : notice.error(t('no_music_is_playing'))
            }
          >
            <MdMoreHoriz />
          </Button>
          <div className="divider" />
        </>
      )}
      <Button square variant="ghost" size="sm" onClick={openPlaylistPlayqueueDrawer}>
        <MdOutlineQueueMusic />
      </Button>
      {miniMode ? null : (
        <Button square variant="ghost" size="sm" onClick={onPrevious}>
          <MdSkipPrevious />
        </Button>
      )}
      <Button square variant="primary" size="sm" onClick={paused ? onPlay : onPause} loading={loading}>
        {paused ? <MdPlayArrow /> : <MdPause />}
      </Button>
      <Button square variant="ghost" size="sm" onClick={onNext}>
        <MdSkipNext />
      </Button>
    </Style>
  );
}

export default Operation;
