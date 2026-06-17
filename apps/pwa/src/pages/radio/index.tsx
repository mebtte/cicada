import { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { Routes, Route, useNavigate } from 'react-router-dom';
import withLogin from '@/platform/with_login';
import PageContainer from '@/components/page_container';
import useDocumentTitle from '@/utils/use_document_title';
import { t } from '@/i18n';
import { ROOT_PATH } from '@/constants/route';
import dialog from '@/utils/dialog';
import playerContext from '@/features/player/context';
import useMusicbillList from '@/features/player/use_musicbill_list';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '@/features/player/eventemitter';
import MusicDrawer from '@/features/player/drawers/music_drawer';
import MusicbillMusicDrawer from '@/features/player/drawers/musicbill_music_drawer';
import ArtistDrawer from '@/features/player/drawers/artist_drawer';
import MusicbillDrawer from '@/features/player/drawers/musicbill_drawer';
import UserDrawer from '@/features/player/drawers/user_drawer';
import useRadioQueue from './use_radio_queue';
import useRadioAudio from './use_radio_audio';
import useRadioPreload from './use_radio_preload';
import useRadioMediaSession from './use_radio_media_session';
import useDisableSwipeBack from './use_disable_swipe_back';
import RadioPage from './page';
import RadioQueueDrawer from './queue_drawer';

const Style = styled(PageContainer)`
  overflow: hidden;
`;

function Radio() {
  useDocumentTitle(t('radio'));
  useDisableSwipeBack();

  const { status: getMusicbillListStatus, musicbillList } = useMusicbillList();
  const {
    queue,
    currentIndex,
    currentMusic,
    nextMusic,
    next,
    playImmediately,
    fetchingMessage,
  } = useRadioQueue();
  const { audio, paused, loading, play, pause, togglePlay } = useRadioAudio({
    queueMusic: currentMusic,
    onEnded: next,
  });
  useRadioPreload({ audio, nextMusic });
  useRadioMediaSession({
    music: currentMusic,
    audio,
    paused,
    onPlay: play,
    onPause: pause,
    onNext: next,
  });

  const navigate = useNavigate();
  const onExit = useCallback(() => {
    dialog.confirm({
      title: t('exit_radio_mode'),
      content: t('exit_radio_mode_confirm'),
      onConfirm: () => navigate(ROOT_PATH.PLAYER),
    });
  }, [navigate]);

  const [queueDrawerOpen, setQueueDrawerOpen] = useState(false);
  const onOpenQueue = useCallback(() => {
    // 触发 useDynamicZIndex 把抽屉抬到当前栈顶, 让后续打开的 MusicDrawer
    // / ArtistDrawer 还能盖在它上面.
    playerEventemitter.emit(
      PlayerEventType.OPEN_PLAYLIST_PLAYQUEUE_DRAWER,
      null,
    );
    setQueueDrawerOpen(true);
  }, []);
  const onCloseQueue = useCallback(() => setQueueDrawerOpen(false), []);

  // 透传给主播放器现成的 drawer 组件: 它们依赖 playqueue/musicbillList 决定
  // 列表中的高亮态和乐单写入入口.
  const contextValue = useMemo(
    () => ({
      playEnabled: false,
      playNextEnabled: false,
      addToPlaylistEnabled: false,
      exportEnabled: false,

      getMusicbillListStatus,
      musicbillList,

      audioLoading: loading,
      audioPaused: paused,
      audioDuration: 0,
      audioBufferedPercent: 0,

      playlist: [],

      playqueue: queue,
      currentPlayqueuePosition: currentIndex,

      lyricPanelOpen: false,

      exportingMusicList: [],
    }),
    [
      getMusicbillListStatus,
      musicbillList,
      loading,
      paused,
      queue,
      currentIndex,
    ],
  );

  // drawer 的"立即播放"按钮落到电台自己的队列里.
  useEffect(() => {
    const unlistenPlay = playerEventemitter.listen(
      PlayerEventType.ACTION_PLAY_MUSIC,
      ({ music }) => playImmediately(music),
    );
    return () => {
      unlistenPlay();
    };
  }, [playImmediately]);

  return (
    <playerContext.Provider value={contextValue}>
      <Style>
        <RadioPage
          queueMusic={currentMusic}
          paused={paused}
          loading={loading}
          fetchingMessage={fetchingMessage}
          onTogglePlay={togglePlay}
          onNext={next}
          onOpenQueue={onOpenQueue}
          onExit={onExit}
        />
      </Style>
      <MusicDrawer />
      <MusicbillMusicDrawer />
      <ArtistDrawer />
      <MusicbillDrawer />
      <UserDrawer />
      <RadioQueueDrawer
        open={queueDrawerOpen}
        onClose={onCloseQueue}
        queue={queue}
        currentIndex={currentIndex}
      />
    </playerContext.Provider>
  );
}

function RadioRoutes() {
  return (
    <Routes>
      <Route path="/*" element={<Radio />} />
    </Routes>
  );
}

export default withLogin(RadioRoutes);
