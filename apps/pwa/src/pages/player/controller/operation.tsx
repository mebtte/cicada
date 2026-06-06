import styled, { css } from 'styled-components';
import Button from '@/components/button';
import { Tooltip } from '@/components';
import {
  MdOutlineQueueMusic,
  MdPause,
  MdPlayArrow,
  MdSkipPrevious,
  MdSkipNext,
  MdMoreHoriz,
} from 'react-icons/md';
import { PostAdd, QueueInsert } from '@/components/icon';
import { CSSVariable } from '@/global_style';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../eventemitter';
import { QueueMusic } from '../constants';
import dialog from '@/utils/dialog';
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
const alertNoPlayingMusic = () =>
  dialog.alert({ content: t('no_music_is_playing') });

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
  const onTogglePlay = () => {
    if (!queueMusic) {
      return alertNoPlayingMusic();
    }
    return paused ? onPlay() : onPause();
  };

  return (
    <Style>
      {miniMode ? null : (
        <>
          <Tooltip content={t('play_next')}>
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
                  : alertNoPlayingMusic()
              }
            >
              <QueueInsert />
            </Button>
          </Tooltip>
          <Tooltip content={t('add_to_musicbill')}>
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
                  : alertNoPlayingMusic()
              }
            >
              <PostAdd />
            </Button>
          </Tooltip>
          <Button
            square
            variant="ghost"
            size="sm"
            onClick={() =>
              queueMusic
                ? playerEventemitter.emit(PlayerEventType.OPEN_MUSIC_DRAWER, {
                    id: queueMusic.id,
                  })
                : alertNoPlayingMusic()
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
      <Button
        square
        variant="primary"
        size="sm"
        onClick={onTogglePlay}
        loading={!!queueMusic && loading}
      >
        {paused ? <MdPlayArrow /> : <MdPause />}
      </Button>
      <Button square variant="ghost" size="sm" onClick={onNext}>
        <MdSkipNext />
      </Button>
    </Style>
  );
}

export default Operation;
