import { useEffect } from 'react';
import { PlaylistMusic } from '../constants';
import storage, { Key } from '../storage';
import logger from '@/utils/logger';
import notice from '@/utils/notice';
import styled from 'styled-components';
import IconButton from '@/components/icon_button';
import { MdCheck, MdClose } from 'react-icons/md';
import upperCaseFirstLetter from '@/style/upper_case_first_letter';
import eventemitter, { EventType } from '../eventemitter';
import { t } from '@/i18n';

const Restore = styled.div`
  > .text {
    padding-top: 10px;
    ${upperCaseFirstLetter}
  }

  > .actions {
    margin-top: 5px;

    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 5px;

    > .action {
      color: #fff;
    }
  }
`;

function usePlaylistRestore(playlist: PlaylistMusic[]) {
  useEffect(() => {
    storage.setItem(Key.PLAYLIST, playlist);
    return () => void storage.removeItem(Key.PLAYLIST);
  }, [playlist]);

  useEffect(() => {
    let noticeId: string | undefined;
    storage
      .getItem(Key.PLAYLIST)
      .then((cachedPlaylist) => {
        if (cachedPlaylist && cachedPlaylist.length > 0) {
          noticeId = notice.info(
            <Restore>
              <div className="text">{t('question_restore_playlist')}</div>
              <div className="actions">
                <IconButton
                  className="action"
                  onClick={() => {
                    notice.close(noticeId!);
                    return eventemitter.emit(
                      EventType.ACTION_ADD_MUSIC_LIST_TO_PLAYLIST,
                      {
                        musicList: cachedPlaylist,
                      },
                    );
                  }}
                >
                  <MdCheck />
                </IconButton>
                <IconButton
                  className="action"
                  onClick={() => notice.close(noticeId!)}
                >
                  <MdClose />
                </IconButton>
              </div>
            </Restore>,
            { duration: 0, closable: false },
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
