import styled from 'styled-components';
import Button from '@/components/button';
import { MdPlaylistAdd } from 'react-icons/md';
import notice from '@/utils/notice';
import { t } from '@/i18n';
import { Singer } from './constants';
import { CONTROLLER_FLOATING_RESERVED_HEIGHT } from '../constants';
import addMusicListToPlaylist from '../add_to_playlist';

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
  singer,
  floatingControllerOffset = false,
}: {
  singer: Singer;
  floatingControllerOffset?: boolean;
}) {
  return (
    <Style $floatingControllerOffset={floatingControllerOffset}>
      <div className="left">
        <Button
          square
          variant="ghost"
          size="sm"
          aria-label={t('add_to_playlist')}
          onClick={() =>
            singer.musicList.length
              ? addMusicListToPlaylist(singer.musicList)
              : notice.error(t('no_music_singer_warning'))
          }
        >
          <MdPlaylistAdd />
        </Button>
      </div>
    </Style>
  );
}

export default Toolbar;
