import styled from 'styled-components';
import { Helmet } from 'react-helmet';
import withLogin from '@/platform/with_login';
import PageContainer from '../page_container';
import Sidebar from './sidebar';
import Header from './header';
import Controller from './controller';
import Route from './route';
import useMusicbillList from './use_musicbill_list';
import useAudioState from './use_audio_state';
import usePlaylist from './use_playlist';
import usePlayqueue from './use_playqueue';
import usePlayMode from './use_play_mode';
import Context from './context';
import Audio from './audio';
import useMediaSession from './use_media_session';
import MusicOperatePopup from './music_operate_popup';
import MusicDrawer from './music_drawer';
import PlaylistPlayqueueDrawer from './playlist_playqueue_drawer';
import AddMusicToMusicbillDrawer from './add_music_to_musicbill_drawer';
import MusicbillOrderDrawer from './musicbilll_order_drawer';
import { QueueMusic } from './constants';
import LyricPanel from './lyric_panel';
import useKeyboard from './use_keyboard';
import MusicDownloadDialog from './music_download_dialog';
import SingerDrawer from './singer_drawer';
import EditDialog from './edit_dialog';
import ProfileEditPopup from './profile_edit_popup';
import UserDrawer from './user_drawer';
import MusicbillDrawer from './musicbill_drawer';

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
  const playMode = usePlayMode();
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

  useKeyboard();
  useMediaSession(queueMusic);

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

        playMode,
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
            <Controller
              queueMusic={queueMusic}
              paused={audioPaused}
              loading={audioLoading}
              duration={audioDuration}
            />
            <LyricPanel />
          </>
        ) : null}
      </Style>

      {/* dynamic z-index */}
      <SingerDrawer />
      <MusicDrawer />
      <PlaylistPlayqueueDrawer />
      <AddMusicToMusicbillDrawer />
      <MusicbillOrderDrawer />
      <MusicDownloadDialog />
      <MusicOperatePopup />
      <UserDrawer />
      <MusicbillDrawer />

      {/* fixed z-index */}
      <ProfileEditPopup />
      <EditDialog />

      {queueMusic ? (
        <Audio playMode={playMode} queueMusic={queueMusic} />
      ) : null}
    </Context.Provider>
  );
}

export default withLogin(Wrapper);
