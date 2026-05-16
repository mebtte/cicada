import styled from 'styled-components';
import Button from '@/components/button';
import {
  MdPlayArrow,
  MdReadMore,
  MdOutlinePostAdd,
  MdPlaylistAdd,
} from 'react-icons/md';
import { IconExport } from '@/components/icon';
import { MusicDetail } from './constants';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../eventemitter';
import { CONTROLLER_FLOATING_RESERVED_HEIGHT } from '../constants';
import { openExportMusicListDialog } from '../export_music_list';
import addMusicListToPlaylist from '../add_to_playlist';
import { t } from '@/i18n';

const Style = styled.div<{ $floatingControllerOffset: boolean }>`
  z-index: 1;

  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  bottom: ${({ $floatingControllerOffset }) =>
    $floatingControllerOffset
      ? CONTROLLER_FLOATING_RESERVED_HEIGHT
      : 'calc(14px + env(safe-area-inset-bottom, 0))'};
  max-width: calc(100% - 32px);
  padding: 8px 12px;
  box-sizing: border-box;

  display: flex;
  align-items: center;
  gap: 8px;

  background: rgb(255 255 255 / 0.92);
  border: 2px solid rgb(229 229 229);
  border-radius: 16px;
  box-shadow:
    0 4px 0 rgb(229 229 229),
    0 10px 24px rgb(0 0 0 / 0.1);
  backdrop-filter: blur(12px);

  > .left {
    min-width: 0;

    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

function Toolbar({
  music,
  floatingControllerOffset = false,
}: {
  music: MusicDetail;
  floatingControllerOffset?: boolean;
}) {
  return (
    <Style $floatingControllerOffset={floatingControllerOffset}>
      <div className="left">
        <Button
          square
          variant="primary"
          size="sm"
          aria-label={t('play')}
          onClick={() =>
            playerEventemitter.emit(PlayerEventType.ACTION_PLAY_MUSIC, {
              music,
            })
          }
        >
          <MdPlayArrow />
        </Button>
        <Button
          square
          variant="ghost"
          size="sm"
          aria-label={t('play_next')}
          onClick={() =>
            playerEventemitter.emit(
              PlayerEventType.ACTION_INSERT_MUSIC_TO_PLAYQUEUE,
              {
                music,
              },
            )
          }
        >
          <MdReadMore />
        </Button>
        <Button
          square
          variant="ghost"
          size="sm"
          aria-label={t('add_to_musicbill')}
          onClick={() =>
            playerEventemitter.emit(
              PlayerEventType.OPEN_MUSICBILL_MUSIC_DRAWER,
              {
                music,
              },
            )
          }
        >
          <MdOutlinePostAdd />
        </Button>
        <Button
          square
          variant="ghost"
          size="sm"
          aria-label={t('add_to_playlist')}
          onClick={() => addMusicListToPlaylist([music])}
        >
          <MdPlaylistAdd />
        </Button>
        <Button
          square
          variant="ghost"
          size="sm"
          aria-label={t('export_music')}
          onClick={() => openExportMusicListDialog([music])}
        >
          <IconExport size="1em" />
        </Button>
      </div>
    </Style>
  );
}

export default Toolbar;
