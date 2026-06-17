import styled from 'styled-components';
import Button from '@/components/button';
import { Tooltip } from '@/components';
import {
  PostAdd,
  SkipNext,
  PlayArrow,
  Pause,
  Exit,
  QueueMusic as QueueMusicIcon,
} from '@/components/icon';
import { flexCenter } from '@/style/flexbox';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '@/features/player/eventemitter';
import { QueueMusic } from '@/features/player/constants';
import { t } from '@/i18n';

const Style = styled.div`
  ${flexCenter}
  gap: clamp(4px, 2vw, 12px);

  > button {
    flex: 0 0 auto;
  }
`;

function Operation({
  queueMusic,
  paused,
  loading,
  onTogglePlay,
  onNext,
  onOpenQueue,
  onExit,
}: {
  queueMusic: QueueMusic;
  paused: boolean;
  loading: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onOpenQueue: () => void;
  onExit: () => void;
}) {
  return (
    <Style>
      <Tooltip content={t('playqueue')}>
        <Button
          square
          variant="ghost"
          size="sm"
          aria-label={t('playqueue')}
          onClick={onOpenQueue}
        >
          <QueueMusicIcon />
        </Button>
      </Tooltip>
      <Tooltip content={t('add_to_musicbill')}>
        <Button
          square
          variant="ghost"
          size="sm"
          onClick={() =>
            playerEventemitter.emit(
              PlayerEventType.OPEN_MUSICBILL_MUSIC_DRAWER,
              { music: queueMusic },
            )
          }
        >
          <PostAdd />
        </Button>
      </Tooltip>
      <Button
        square
        variant="primary"
        size="lg"
        onClick={onTogglePlay}
        loading={loading}
      >
        {paused ? <PlayArrow /> : <Pause />}
      </Button>
      <Button square variant="ghost" size="sm" onClick={onNext}>
        <SkipNext />
      </Button>
      <Tooltip content={t('exit_radio_mode')}>
        <Button
          square
          variant="ghost"
          size="sm"
          aria-label={t('exit_radio_mode')}
          onClick={onExit}
        >
          <Exit />
        </Button>
      </Tooltip>
    </Style>
  );
}

export default Operation;
