import styled from 'styled-components';
import Button from '@/components/button';
import { Tooltip } from '@/components';
import { CSSVariable } from '@/global_style';
import {
  Export,
  PlaylistAdd,
  PostAdd,
  QueueInsert,
  PlayArrow,
  Edit,
} from '@/components/icon';
import { useUser } from '@/global_states/server';
import { useSetting } from '@/global_states/setting';
import { ADMIN_PATH, ROOT_PATH } from '@/constants/route';
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

function Toolbar({
  music,
  floatingControllerOffset = false,
}: {
  music: MusicDetail;
  floatingControllerOffset?: boolean;
}) {
  const user = useUser();
  const adminQuickEdit = useSetting((s) => s.adminQuickEdit);
  // 编辑按钮: 管理员开启「管理员快捷编辑」时才出现, 点击跳转到管理页并自动打开该音乐的编辑 drawer
  const showAdminEdit = !!user?.admin && adminQuickEdit;
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
          <PlayArrow />
        </Button>
        <Tooltip content={t('play_next')}>
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
            <QueueInsert />
          </Button>
        </Tooltip>
        <Tooltip content={t('add_to_musicbill')}>
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
            <PostAdd />
          </Button>
        </Tooltip>
        <Tooltip content={t('add_to_playlist')}>
          <Button
            square
            variant="ghost"
            size="sm"
            aria-label={t('add_to_playlist')}
            onClick={() => addMusicListToPlaylist([music])}
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
            onClick={() => openExportMusicListDialog([music])}
          >
            <Export size="1em" />
          </Button>
        </Tooltip>
        {showAdminEdit ? (
          <Tooltip content={t('edit_music')}>
            <Button
              square
              variant="ghost"
              size="sm"
              aria-label={t('edit_music')}
              onClick={() =>
                window.open(
                  `#${ROOT_PATH.ADMIN}/${ADMIN_PATH.MUSIC_MANAGEMENT}?edit_music_id=${encodeURIComponent(music.id)}`,
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
