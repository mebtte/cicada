import styled from 'styled-components';
import withLogin from '@/platform/with_login';
import { useEffect, useMemo } from 'react';
import PageContainer from '@/components/page_container';
import useDocumentTitle from '@/utils/use_document_title';
import { t } from '@/i18n';
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
import MusicDrawer from '@/features/player/drawers/music_drawer';
import PlaylistPlayqueueDrawer from './playlist_playqueue_drawer';
import MusicbillMusicDrawer from '@/features/player/drawers/musicbill_music_drawer';
import SortMusicbillDrawer from './sort_musicbilll_drawer';
import MusicbillSharedUserDrawer from './musicbill_shared_user_drawer';
import MusicbillFollowedArtistDrawer from './musicbill_followed_artist_drawer';
import SharedMusicbillInvitationDrawer from './pages/shared_musicbill_invitation';
import { QueueMusic } from './constants';
import LyricPanel from './lyric_panel';
import ArtistDrawer from '@/features/player/drawers/artist_drawer';
import UserDrawer from '@/features/player/drawers/user_drawer';
import MusicbillDrawer from '@/features/player/drawers/musicbill_drawer';
import AuthorizedDeviceDrawer from './authorized_device_drawer';
import useLyricPanelOpen from './use_lyric_panel_open';
import useSearchHotkey from './use_search_hotkey';
import e, { EventType } from './eventemitter';
import NetworkStatus from './network_status';
import useProfileUpdate from './use_profile_update';
import TwoFADialog from './2fa_dialog';
import PlaylistAddAnimation from './playlist_add_animation';
import PlayqueueInsertAnimation from './playqueue_insert_animation';
import PublicMusicbillCollectionDrawer from './public_musicbill_collection_drawer';
import useOpenSidebarSwipe from './use_open_sidebar_swipe';

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
  useDocumentTitle(t('player'));
  useProfileUpdate();
  useSearchHotkey();
  useOpenSidebarSwipe();

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
    audio,
  } = useAudio({
    queueMusic,
    playqueue,
    currentPlayqueuePosition,
  });

  useMediaSession({
    music: queueMusic,
    audio,
    paused: audioPaused,
    duration: audioDuration,
  });
  useEffect(
    () => e.emit(EventType.CURRENT_MUSIC_CHANGE, { queueMusic }),
    [queueMusic],
  );

  const contextValue = useMemo(
    () => ({
      playEnabled: true,
      playNextEnabled: true,
      addToPlaylistEnabled: true,
      downloadEnabled: true,

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
      </Style>

      {/* dynamic z-index */}
      <ArtistDrawer />
      <MusicDrawer />
      <PlaylistPlayqueueDrawer />
      <MusicbillMusicDrawer />
      <SortMusicbillDrawer />
      <UserDrawer />
      <MusicbillDrawer />
      <PublicMusicbillCollectionDrawer />
      <AuthorizedDeviceDrawer />
      <MusicbillSharedUserDrawer />
      <MusicbillFollowedArtistDrawer />
      <SharedMusicbillInvitationDrawer />

      <PlaylistAddAnimation />
      <PlayqueueInsertAnimation />

      {/* fixed z-index */}
      <TwoFADialog />
    </context.Provider>
  );
}

export default withLogin(Wrapper);
