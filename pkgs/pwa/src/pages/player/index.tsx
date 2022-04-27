import React from 'react';
import styled from 'styled-components';
import { Helmet } from 'react-helmet';

import scrollbarAsNeeded from '@/style/scrollbar_as_needed';
import withSignin from '@/platform/with_signin';
import electron from '@/platform/electron';
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
import useSearchWord from './use_search_word';
import useVolume from './use_volume';
import Context from './context';
import Audio from './audio';
import Electron from './electron';
import MediaSession from './media_session';
import SingerDrawer from './singer_drawer';
import MusicOperatePopup from './music_operate_popup';
import MusicDrawer from './music_drawer';
import ListDrawer from './list_drawer';
import MusicbillListDrawer from './musicbill_list_drawer';
import MusicbillOrderDrawer from './musicbilll_order_drawer';
import CreateMusicbillDialog from './create_musicbill_dialog';
import { QueueMusic } from './constants';
import Lyric from './lyric';
import UserDrawer from './user_drawer';

const Scrollable = styled(PageContainer)`
  overflow: auto;
  ${scrollbarAsNeeded};
`;
const Style = styled.div`
  min-width: 900px;
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  > .container {
    flex: 1;
    min-height: 0;
    display: flex;
    > .content {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
    }
  }
`;

const Wrapper = () => {
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
  const searchWord = useSearchWord();
  const queueMusic = playqueue[currentPlayqueuePosition] as QueueMusic | null;
  const volume = useVolume();

  return (
    <Context.Provider
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
        searchWord,
        volume,
      }}
    >
      <Helmet>
        <title>知了</title>
      </Helmet>
      <Scrollable>
        <Style>
          <div className="container">
            <Sidebar />
            <div className="content">
              <Header />
              <Route />
            </div>
          </div>
          <Controller />

          <Lyric music={queueMusic ? queueMusic.music : null} />
        </Style>
      </Scrollable>

      <SingerDrawer />
      <MusicDrawer />
      <ListDrawer />
      <MusicbillListDrawer />
      <MusicbillOrderDrawer />
      <UserDrawer />

      <CreateMusicbillDialog />

      <MusicOperatePopup />

      {queueMusic ? (
        <>
          <Audio volume={volume} playMode={playMode} queueMusic={queueMusic} />
          <MediaSession music={queueMusic.music} />
        </>
      ) : null}

      {electron ? <Electron /> : null}
    </Context.Provider>
  );
};

export default withSignin()(Wrapper);
