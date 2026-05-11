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
import { openDownloadMusicListDialog } from '../download_music_list';
import addMusicListToPlaylist from '../add_to_playlist';
import { t } from '@/i18n';

const Style = styled.div<{ $floatingControllerOffset: boolean }>`
  z-index: 1;

  position: ${({ $floatingControllerOffset }) =>
    $floatingControllerOffset ? 'absolute' : 'sticky'};
  left: ${({ $floatingControllerOffset }) =>
    $floatingControllerOffset ? 0 : 'auto'};
  right: ${({ $floatingControllerOffset }) =>
    $floatingControllerOffset ? 0 : 'auto'};
  bottom: ${({ $floatingControllerOffset }) =>
    $floatingControllerOffset ? CONTROLLER_FLOATING_RESERVED_HEIGHT : 0};
  flex-shrink: 0;
  height: calc(64px + env(safe-area-inset-bottom, 0));
  padding: 10px 20px calc(14px + env(safe-area-inset-bottom, 0)) 20px;

  display: flex;
  align-items: center;
  gap: 10px;

  background: rgb(255 255 255 / 0.9);
  border-top: 2px solid rgb(229 229 229);
  backdrop-filter: blur(8px);

  > .left {
    flex: 1;
    min-width: 0;

    display: flex;
    align-items: center;
    gap: 10px;
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
          aria-label={t('download')}
          onClick={() => openDownloadMusicListDialog([music])}
        >
          <IconExport size="1em" />
        </Button>
      </div>
    </Style>
  );
}

export default Toolbar;
