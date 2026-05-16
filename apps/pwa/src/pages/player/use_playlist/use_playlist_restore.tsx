import { useEffect } from 'react';
import { MusicWithSingerAliases, PlaylistMusic } from '../constants';
import storage, { Key } from '../storage';
import logger from '@/utils/logger';
import notice from '@/utils/notice';
import styled from 'styled-components';
import Button from '@/components/button';
import { MdClose, MdPlaylistPlay } from 'react-icons/md';
import upperCaseFirstLetter from '@/style/upper_case_first_letter';
import eventemitter, { EventType } from '../eventemitter';
import { t } from '@/i18n';
import useUnmount from '@/utils/use_unmount';
import { CSSVariable } from '@/global_style';

function RestoreNotice({
  getNoticeId,
  playlist,
}: {
  getNoticeId: () => string;
  playlist: MusicWithSingerAliases[];
}) {
  return (
    <Restore>
      <div className="badge">
        <MdPlaylistPlay />
      </div>
      <div className="body">
        <div className="text">{t('question_restore_playlist')}</div>
        <div className="action-box">
          <Button
            className="confirm-action"
            variant="primary"
            size="sm"
            onClick={() => {
              notice.close(getNoticeId());
              return eventemitter.emit(
                EventType.ACTION_ADD_MUSIC_LIST_TO_PLAYLIST,
                {
                  musicList: playlist,
                },
              );
            }}
          >
            {t('alert_confirm')}
          </Button>
          <Button
            className="dismiss-action"
            square
            variant="ghost"
            size="sm"
            title={t('cancel')}
            aria-label={t('cancel')}
            onClick={() => notice.close(getNoticeId())}
          >
            <MdClose />
          </Button>
        </div>
      </div>
    </Restore>
  );
}

const Restore = styled.div`
  width: min(260px, 100%);

  display: flex;
  align-items: center;
  gap: 12px;

  > .badge {
    flex: 0 0 auto;
    width: 44px;
    height: 44px;

    display: flex;
    align-items: center;
    justify-content: center;

    border: 2px solid rgb(29 139 94);
    border-radius: 14px;
    background: #fff;
    box-shadow: 0 4px 0 rgb(29 139 94);
    color: rgb(44 182 125);
    font-size: 28px;

    > svg {
      display: block;
      width: 1em;
      height: 1em;
    }
  }

  > .body {
    flex: 1;
    min-width: 0;
    padding-top: 1px;

    > .text {
      color: #fff;
      font-size: 14px;
      font-weight: 900;
      line-height: 1.35;
      ${upperCaseFirstLetter}
    }

    > .action-box {
      margin-top: 9px;

      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 9px;

      > .confirm-action {
        color: rgb(29 139 94);
        background: #fff;
        border-color: ${CSSVariable.COLOR_CONTROL_NEUTRAL};
        box-shadow: 0 3px 0 ${CSSVariable.COLOR_CONTROL_NEUTRAL};

        &:not(:disabled):hover {
          filter: brightness(1.03);
        }

        &:not(:disabled):active {
          box-shadow: none;
        }
      }
    }
  }
`;

function usePlaylistRestore(playlist: PlaylistMusic[]) {
  useEffect(
    () =>
      playlist.length
        ? void storage
            .setItem(Key.PLAYLIST, playlist)
            .catch((error) =>
              logger.error(error, 'Failed to save playlist to storage'),
            )
        : undefined,
    [playlist],
  );
  useUnmount(
    () =>
      void storage
        .removeItem(Key.PLAYLIST)
        .catch((error) =>
          logger.error(error, 'Failed to remove playlist from storage'),
        ),
  );

  useEffect(() => {
    let noticeId: string | undefined;
    storage
      .getItem(Key.PLAYLIST)
      .then((cachedPlaylist) => {
        if (cachedPlaylist && cachedPlaylist.length > 0) {
          noticeId = notice.info(
            <RestoreNotice
              getNoticeId={() => noticeId!}
              playlist={cachedPlaylist}
            />,
            { duration: 0, closable: false, showTypeIcon: false },
          );
        }
      })
      .catch((error) => logger.error(error, 'Failed to get cached playlist'));

    const closeNotice = () => {
      if (noticeId) {
        notice.close(noticeId);
        noticeId = undefined;
      }
    };
    const unlistenActionPlayMusic = eventemitter.listen(
      EventType.ACTION_PLAY_MUSIC,
      closeNotice,
    );
    const unlistenActionAddMusicListToPlaylist = eventemitter.listen(
      EventType.ACTION_ADD_MUSIC_LIST_TO_PLAYLIST,
      closeNotice,
    );
    const unlistenActionInsertMusicToPlayqueue = eventemitter.listen(
      EventType.ACTION_INSERT_MUSIC_TO_PLAYQUEUE,
      closeNotice,
    );
    return () => {
      unlistenActionPlayMusic();
      unlistenActionAddMusicListToPlaylist();
      unlistenActionInsertMusicToPlayqueue();
      closeNotice();
    };
  }, []);
}

export default usePlaylistRestore;
