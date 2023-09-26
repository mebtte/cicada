import styled from 'styled-components';
import withLogin from '@/platform/with_login';
import { useEffect } from 'react';
import PageContainer from '@/components/page_container';
import useDocumentTitle from '@/utils/use_document_title';
import { t } from '@/i18n';
import capitalize from '#/utils/capitalize';
import Sidebar from './sidebar';
import Header from './header';
import Controller from './controller';
import Route from './route';
import useMusicbillList from './use_musicbill_list';
import usePlaylist from './use_playlist';
import usePlayqueue from './use_playqueue';
import Context from './context';
import useAudio from './use_audio';
import useMediaSession from './use_media_session';
import MusicDrawer from './music_drawer';
import PlaylistPlayqueueDrawer from './playlist_playqueue_drawer';
import MusicbillMusicDrawer from './musicbill_music_drawer';
import MusicbillOrderDrawer from './musicbilll_order_drawer';
import MusicbillSharedUserDrawer from './musicbill_shared_user_drawer';
import { QueueMusic } from './constants';
import LyricPanel from './lyric_panel';
import useKeyboard from './use_keyboard';
import SingerDrawer from './singer_drawer';
import ProfileEditPopup from './profile_edit_popup';
import UserDrawer from './user_drawer';
import PublicMusicbillDrawer from './public_musicbill_drawer';
import useLyricPanelOpen from './use_lyric_panel_open';
import e, { EventType } from './eventemitter';
import SingerModifyRecordDrawer from './singer_modify_record_drawer';
import NetworkStatus from './network_status';
import useProfileUpdate from './use_profile_update';

const Style = styled(PageContainer)`
  display: flex;
  flex-direction: column;

  overflow: hidden;

  > .container {
    flex: 1;
    min-height: 0;

    display: flex;

    > .content {
      position: relative;

      flex: 1;
      min-width: 0;

      display: flex;
      flex-direction: column;
    }
  }
`;

function Wrapper() {
  useDocumentTitle(capitalize(t('cicada')));
  useProfileUpdate();

  const { status: getMusicbillListStatus, musicbillList } = useMusicbillList();
  const playlist = usePlaylist();
  const { playqueue, currentPosition: currentPlayqueuePosition } =
    usePlayqueue(playlist);
  const queueMusic = playqueue[currentPlayqueuePosition] as
    | QueueMusic
    | undefined;
  const lyricPanelOpen = useLyricPanelOpen();
  const {
    loading: audioLoading,
    paused: audioPaused,
    duration: audioDuration,
    bufferedPercent: audioBufferedPercent,
  } = useAudio({ queueMusic });

  useKeyboard({ paused: audioPaused, queueMusic, musicbillList });
  useMediaSession(queueMusic);

  useEffect(() => {
    e.emit(EventType.CURRENT_MUSIC_CHANGE, { queueMusic });
  }, [queueMusic]);

  return (
    <Context.Provider
      // eslint-disable-next-line react/jsx-no-constructed-context-values
      value={{
        getMusicbillListStatus,
        musicbillList,

        audioLoading,
        audioPaused,
        audioDuration,
        audioBufferedPercent,

        playlist,

        playqueue,
        currentPlayqueuePosition,

        lyricPanelOpen,
      }}
    >
      <Style>
        <NetworkStatus />
        <div className="container">
          <Sidebar />
          <div className="content">
            <Header />
            <Route />
          </div>
        </div>
        {queueMusic ? (
          <>
            <Controller lyricPanelOpen={lyricPanelOpen} />
            <LyricPanel open={lyricPanelOpen} />
          </>
        ) : null}
      </Style>

      {/* dynamic z-index */}
      <SingerDrawer />
      <MusicDrawer />
      <PlaylistPlayqueueDrawer />
      <MusicbillMusicDrawer />
      <MusicbillOrderDrawer />
      <UserDrawer />
      <PublicMusicbillDrawer />
      <MusicbillSharedUserDrawer />
      <SingerModifyRecordDrawer />

      {/* fixed z-index */}
      <ProfileEditPopup />
    </Context.Provider>
  );
}

export default withLogin(Wrapper);
