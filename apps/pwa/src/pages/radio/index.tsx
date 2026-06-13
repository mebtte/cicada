import { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { Routes, Route, useNavigate } from 'react-router-dom';
import withLogin from '@/platform/with_login';
import PageContainer from '@/components/page_container';
import useDocumentTitle from '@/utils/use_document_title';
import { t } from '@/i18n';
import { ROOT_PATH } from '@/constants/route';
import dialog from '@/utils/dialog';
import playerContext from '@/pages/player/context';
import useMusicbillList from '@/pages/player/use_musicbill_list';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '@/pages/player/eventemitter';
import MusicDrawer from '@/pages/player/music_drawer';
import MusicbillMusicDrawer from '@/pages/player/musicbill_music_drawer';
import ArtistDrawer from '@/pages/player/artist_drawer';
import useRadioQueue from './use_radio_queue';
import useRadioAudio from './use_radio_audio';
import useRadioPreload from './use_radio_preload';
import useRadioMediaSession from './use_radio_media_session';
import RadioPage from './page';
import RadioQueueDrawer from './queue_drawer';

const Style = styled(PageContainer)`
  overflow: hidden;
`;

function Radio() {
  useDocumentTitle(t('radio'));

  const { status: getMusicbillListStatus, musicbillList } = useMusicbillList();
  const {
    queue,
    currentIndex,
    currentMusic,
    nextMusic,
    next,
    insertNext,
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

  // "下一首播放": 先打开队列抽屉, 等抽屉挂载完成再插入歌曲, 让插入项触发
  // useTransition 的入场动画.
  const onPlayNext = useCallback(() => {
    if (!currentMusic) {
      return;
    }
    onOpenQueue();
    window.setTimeout(() => {
      playerEventemitter.emit(
        PlayerEventType.ACTION_INSERT_MUSIC_TO_PLAYQUEUE,
        { music: currentMusic },
      );
    }, 360);
  }, [currentMusic, onOpenQueue]);

  // 透传给主播放器现成的 drawer 组件: 它们依赖 playqueue/musicbillList 决定
  // 列表中的高亮态和乐单写入入口.
  const contextValue = useMemo(
    () => ({
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

  // drawer 的"下一首播放"按钮会发 ACTION_INSERT_MUSIC_TO_PLAYQUEUE,
  // 电台模式下落到自己的队列里.
  useEffect(() => {
    const unlistenInsert = playerEventemitter.listen(
      PlayerEventType.ACTION_INSERT_MUSIC_TO_PLAYQUEUE,
      ({ music }) => insertNext(music),
    );
    // drawer 的"立即播放"按钮: 插入到下一首并跳过.
    const unlistenPlay = playerEventemitter.listen(
      PlayerEventType.ACTION_PLAY_MUSIC,
      ({ music }) => {
        insertNext(music);
        next();
      },
    );
    return () => {
      unlistenInsert();
      unlistenPlay();
    };
  }, [insertNext, next]);

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
          onPlayNext={onPlayNext}
          onOpenQueue={onOpenQueue}
          onExit={onExit}
        />
      </Style>
      <MusicDrawer />
      <MusicbillMusicDrawer />
      <ArtistDrawer />
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
