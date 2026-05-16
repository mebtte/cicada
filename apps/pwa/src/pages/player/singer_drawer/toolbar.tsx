import styled from 'styled-components';
import Button from '@/components/button';
import { MdPlaylistAdd } from 'react-icons/md';
import { IconExport } from '@/components/icon';
import notice from '@/utils/notice';
import { t } from '@/i18n';
import { Singer } from './constants';
import { CONTROLLER_FLOATING_RESERVED_HEIGHT } from '../constants';
import addMusicListToPlaylist from '../add_to_playlist';
import { openExportMusicListDialog } from '../export_music_list';

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
  singer,
  floatingControllerOffset = false,
}: {
  singer: Singer;
  floatingControllerOffset?: boolean;
}) {
  const hasMusic = singer.musicList.length > 0;
  return (
    <Style $floatingControllerOffset={floatingControllerOffset}>
      <div className="left">
        <Button
          square
          variant="ghost"
          size="sm"
          aria-label={t('add_to_playlist')}
          onClick={() =>
            hasMusic
              ? addMusicListToPlaylist(singer.musicList)
              : notice.error(t('no_music_singer_warning'))
          }
        >
          <MdPlaylistAdd />
        </Button>
        <Button
          square
          variant="ghost"
          size="sm"
          aria-label={t('export_music')}
          onClick={() =>
            hasMusic
              ? openExportMusicListDialog(singer.musicList)
              : notice.error(t('no_music_singer_warning'))
          }
        >
          <IconExport size="1em" />
        </Button>
      </div>
    </Style>
  );
}

export default Toolbar;
