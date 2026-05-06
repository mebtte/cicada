import styled from 'styled-components';
import withLogin from '@/platform/with_login';
import { useEffect, useMemo } from 'react';
import PageContainer from '@/components/page_container';
import useDocumentTitle from '@/utils/use_document_title';
import { t } from '@/i18n';
import capitalize from '@/utils/capitalize';
import Sidebar from './sidebar';
import Header from './header';
import Controller from './controller';
import Route from './route';
import useMusicbillList from './use_musicbill_list';
import usePlaylist from './use_playlist';
import usePlayqueue from './use_playqueue';
import context from './context';
import useAudio from './use_audio';
import useMediaSession from './use_media_session';
import MusicDrawer from './music_drawer';
import PlaylistPlayqueueDrawer from './playlist_playqueue_drawer';
import MusicbillMusicDrawer from './musicbill_music_drawer';
import SortMusicbillDrawer from './sort_musicbilll_drawer';
import MusicbillSharedUserDrawer from './musicbill_shared_user_drawer';
import { QueueMusic } from './constants';
import LyricPanel from './lyric_panel';
import SingerDrawer from './singer_drawer';
import UserDrawer from './user_drawer';
import PublicMusicbillDrawer from './public_musicbill_drawer';
import useLyricPanelOpen from './use_lyric_panel_open';
import e, { EventType } from './eventemitter';
import SingerModifyRecordDrawer from './singer_modify_record_drawer';
import NetworkStatus from './network_status';
import useProfileUpdate from './use_profile_update';
import TwoFADialog from './2fa_dialog';
import useStopTimer from './use_stop_timer';
import StopTimer from './stop_timer';
import useDownload from './use_download';

const Style = styled(PageContainer)`
  position: relative;

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

      transform: scale(1);
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
  const stopTimer = useStopTimer();

  useMediaSession(queueMusic);
  useEffect(
    () => e.emit(EventType.CURRENT_MUSIC_CHANGE, { queueMusic }),
    [queueMusic],
  );

  const downloadingMusicList = useDownload();
  const contextValue = useMemo(
    () => ({
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

      stopTimer,

      downloadingMusicList,
    }),
    [
      audioBufferedPercent,
      audioDuration,
      audioLoading,
      audioPaused,
      currentPlayqueuePosition,
      getMusicbillListStatus,
      lyricPanelOpen,
      musicbillList,
      playlist,
      playqueue,
      stopTimer,
      downloadingMusicList,
    ],
  );
  return (
    <context.Provider value={contextValue}>
      <Style>
        <NetworkStatus />
        <div className="container">
          <Sidebar />
          <div className="content">
            <Header />
            <Route />
          </div>
        </div>
        <Controller lyricPanelOpen={lyricPanelOpen} />
        {queueMusic ? <LyricPanel open={lyricPanelOpen} /> : null}

        {stopTimer ? <StopTimer stopTimer={stopTimer} /> : null}
      </Style>

      {/* dynamic z-index */}
      <SingerDrawer />
      <MusicDrawer />
      <PlaylistPlayqueueDrawer />
      <MusicbillMusicDrawer />
      <SortMusicbillDrawer />
      <UserDrawer />
      <PublicMusicbillDrawer />
      <MusicbillSharedUserDrawer />
      <SingerModifyRecordDrawer />

      {/* fixed z-index */}
      <TwoFADialog />
    </context.Provider>
  );
}

export default withLogin(Wrapper);
