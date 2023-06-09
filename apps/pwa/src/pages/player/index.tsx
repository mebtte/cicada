import styled from 'styled-components';
import { Helmet } from 'react-helmet';
import withLogin from '@/platform/with_login';
import { useEffect } from 'react';
import PageContainer from '@/components/page_container';
import Sidebar from './sidebar';
import Header from './header';
import Controller from './controller';
import Route from './route';
import useMusicbillList from './use_musicbill_list';
import useAudioState from './use_audio_state';
import usePlaylist from './use_playlist';
import usePlayqueue from './use_playqueue';
import Context from './context';
import Audio from './audio';
import useMediaSession from './use_media_session';
import MusicDrawer from './music_drawer';
import PlaylistPlayqueueDrawer from './playlist_playqueue_drawer';
import AddMusicToMusicbillDrawer from './add_music_to_musicbill_drawer';
import MusicbillOrderDrawer from './musicbilll_order_drawer';
import { QueueMusic } from './constants';
import LyricPanel from './lyric_panel';
import useKeyboard from './use_keyboard';
import SingerDrawer from './singer_drawer';
import ProfileEditPopup from './profile_edit_popup';
import UserDrawer from './user_drawer';
import PublicMusicbillDrawer from './public_musicbill_drawer';
import useLyricPanelOpen from './use_lyric_panel_open';
import e, { EventType } from './eventemitter';

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
  const { status: getMusicbillListStatus, musicbillList } = useMusicbillList();
  const {
    loading: audioLoading,
    paused: audioPaused,
    duration: audioDuration,
  } = useAudioState();
  const playlist = usePlaylist();
  const { playqueue, currentPosition: currentPlayqueuePosition } =
    usePlayqueue(playlist);
  const queueMusic = playqueue[currentPlayqueuePosition] as
    | QueueMusic
    | undefined;
  const lyricPanelOpen = useLyricPanelOpen();

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

        playlist,

        playqueue,
        currentPlayqueuePosition,

        lyricPanelOpen,
      }}
    >
      <Helmet>
        <title>知了</title>
      </Helmet>
      <Style>
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
      <AddMusicToMusicbillDrawer />
      <MusicbillOrderDrawer />
      <UserDrawer />
      <PublicMusicbillDrawer />

      {/* fixed z-index */}
      <ProfileEditPopup />

      {queueMusic ? <Audio queueMusic={queueMusic} /> : null}
    </Context.Provider>
  );
}

export default withLogin(Wrapper);
