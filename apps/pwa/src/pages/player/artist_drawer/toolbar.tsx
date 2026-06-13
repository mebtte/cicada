import styled from 'styled-components';
import Button from '@/components/button';
import { Tooltip } from '@/components';
import { Export, PlaylistAdd, Edit } from '@/components/icon';
import { CSSVariable } from '@/global_style';
import notice from '@/utils/notice';
import { t } from '@/i18n';
import { useUser } from '@/global_states/server';
import { useSetting } from '@/global_states/setting';
import { ROOT_PATH, ADMIN_PATH } from '@/constants/route';
import { Artist } from './constants';
import { CONTROLLER_FLOATING_RESERVED_HEIGHT } from '../constants';
import { MusicWithArtistAliases } from '../constants';
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
  border: 2px solid ${CSSVariable.COLOR_NEUTRAL_SHADOW};
  border-radius: 16px;
  box-shadow:
    0 4px 0 ${CSSVariable.COLOR_NEUTRAL_SHADOW},
    0 10px 24px rgb(0 0 0 / 0.1);
  backdrop-filter: blur(12px);

  > .left {
    min-width: 0;

    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

const getArtistMusicList = (artist: Artist): MusicWithArtistAliases[] =>
  Array.from(
    new Map(
      [
        ...artist.performerMusicList,
        ...artist.lyricistMusicList,
        ...artist.composerMusicList,
      ].map((music) => [music.id, music]),
    ).values(),
  );

function Toolbar({
  artist,
  floatingControllerOffset = false,
}: {
  artist: Artist;
  floatingControllerOffset?: boolean;
}) {
  const user = useUser();
  const adminQuickEdit = useSetting((s) => s.adminQuickEdit);
  const musicList = getArtistMusicList(artist);
  const hasMusic = musicList.length > 0;
  // 仅在 admin 且开启「管理员快捷编辑」开关时展示编辑入口
  const showAdminEdit = !!user?.admin && adminQuickEdit;
  return (
    <Style $floatingControllerOffset={floatingControllerOffset}>
      <div className="left">
        <Tooltip content={t('add_to_playlist')}>
          <Button
            square
            variant="ghost"
            size="sm"
            aria-label={t('add_to_playlist')}
            onClick={() =>
              hasMusic
                ? addMusicListToPlaylist(musicList)
                : notice.error(t('no_music_artist_warning'))
            }
          >
            <PlaylistAdd />
          </Button>
        </Tooltip>
        <Tooltip content={t('export_music')}>
          <Button
            square
            variant="ghost"
            size="sm"
            aria-label={t('export_music')}
            onClick={() =>
              hasMusic
                ? openExportMusicListDialog(musicList)
                : notice.error(t('no_music_artist_warning'))
            }
          >
            <Export size="1em" />
          </Button>
        </Tooltip>
        {showAdminEdit ? (
          <Tooltip content={t('modify_artist')}>
            <Button
              square
              variant="ghost"
              size="sm"
              aria-label={t('modify_artist')}
              onClick={() =>
                // 在新 tab 打开管理面板的艺人管理, 并通过 edit_artist_id 参数直接打开编辑抽屉
                window.open(
                  `#${ROOT_PATH.ADMIN}/${ADMIN_PATH.ARTIST_MANAGEMENT}?edit_artist_id=${encodeURIComponent(artist.id)}`,
                  '_blank',
                  'noopener,noreferrer',
                )
              }
            >
              <Edit />
            </Button>
          </Tooltip>
        ) : null}
      </div>
    </Style>
  );
}

export default Toolbar;
