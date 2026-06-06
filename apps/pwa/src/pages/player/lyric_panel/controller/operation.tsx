import styled from 'styled-components';
import Button from '@/components/button';
import { Tooltip } from '@/components';
import {
  PostAdd,
  QueueInsert,
  UnfoldLess,
  QueueMusic as QueueMusicIcon,
  SkipNext,
  SkipPrevious,
  PlayArrow,
  Pause,
} from '@/components/icon';
import { flexCenter } from '@/style/flexbox';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../eventemitter';
import { QueueMusic } from '../../constants';
import { t } from '@/i18n';

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
      <Tooltip content={t('add_to_musicbill')}>
        <Button
          square
          variant="ghost"
          size="sm"
          onClick={() =>
            playerEventemitter.emit(
              PlayerEventType.OPEN_MUSICBILL_MUSIC_DRAWER,
              {
                music: queueMusic,
              },
            )
          }
        >
          <PostAdd />
        </Button>
      </Tooltip>
      <Tooltip content={t('play_next')}>
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
          <QueueInsert />
        </Button>
      </Tooltip>
      <Button square variant="ghost" size="sm" onClick={onPrevious}>
        <SkipPrevious />
      </Button>
      <Button
        square
        variant="primary"
        size="lg"
        onClick={paused ? onPlay : onPause}
        loading={loading}
      >
        {paused ? <PlayArrow /> : <Pause />}
      </Button>
      <Button square variant="ghost" size="sm" onClick={onNext}>
        <SkipNext />
      </Button>
      <Button
        square
        variant="ghost"
        size="sm"
        onClick={openPlaylistPlayqueueDrawer}
      >
        <QueueMusicIcon />
      </Button>
      <Tooltip content={t('collapse')}>
        <Button square variant="ghost" size="sm" onClick={closeLyricPanel}>
          <UnfoldLess />
        </Button>
      </Tooltip>
    </Style>
  );
}

export default Operation;
