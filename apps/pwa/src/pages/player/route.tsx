import {
  Routes,
  Route,
  Navigate,
  useNavigate,
} from 'react-router-dom';
import styled from 'styled-components';
import { PLAYER_PATH, ROOT_PATH } from '@/constants/route';
import Musicbill from './pages/musicbill';
import Music from './pages/music';
import User from './pages/user';
import Setting from './pages/setting';
import Exploration from './pages/exploration';
import MusicPlayRecord from './pages/music_play_record';
import ExportingMusic from './pages/exporting_music';
import OfflineCache from './pages/offline_cache';
import Artist from './pages/artist';
import { useEffect } from 'react';
import e, { EventType } from './eventemitter';

const Style = styled.div`
  flex: 1;
  min-height: 0;
  position: relative;
`;

function PublicMusicbillCollectionEntry() {
  const navigate = useNavigate();

  useEffect(() => {
    // 延后一帧，确保全局 drawer 监听已经挂载，再从旧页面地址切换到抽屉形态。
    const frame = window.requestAnimationFrame(() => {
      e.emit(EventType.OPEN_PUBLIC_MUSICBILL_COLLECTION_DRAWER, null);
      navigate(`${ROOT_PATH.PLAYER}${PLAYER_PATH.EXPLORATION}`, {
        replace: true,
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [navigate]);

  return null;
}

function Wrapper() {
  return (
    <Style>
      <Routes>
        <Route path={PLAYER_PATH.EXPLORATION} element={<Exploration />} />
        <Route path={PLAYER_PATH.MUSIC} element={<Music />} />
        <Route path={PLAYER_PATH.MUSICBILL} element={<Musicbill />} />
        <Route path={PLAYER_PATH.ARTIST} element={<Artist />} />
        <Route path={PLAYER_PATH.USER} element={<User />} />
        <Route path={PLAYER_PATH.SETTING} element={<Setting />} />
        <Route path={PLAYER_PATH.EXPORTING_MUSIC} element={<ExportingMusic />} />
        <Route
          path={PLAYER_PATH.PUBLIC_MUSICBILL_COLLECTION}
          element={<PublicMusicbillCollectionEntry />}
        />
        <Route
          path={PLAYER_PATH.MUSIC_PLAY_RECORD}
          element={<MusicPlayRecord />}
        />
        <Route
          path={PLAYER_PATH.OFFLINE_CACHE}
          element={<OfflineCache />}
        />

        <Route
          path="*"
          element={<Navigate to={PLAYER_PATH.EXPLORATION} replace />}
        />
      </Routes>
    </Style>
  );
}

export default Wrapper;
