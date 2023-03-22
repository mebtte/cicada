import { Routes, Route, Navigate } from 'react-router-dom';
import { PLAYER_PATH } from '@/constants/route';
import p from '@/global_states/profile';
import Search from './pages/search';
import Musicbill from './pages/musicbill';
import Setting from './pages/setting';
import MyMusic from './pages/my_music';
import MySinger from './pages/my_singer';
import UserManage from './pages/user_manage';
import MusicbillCollection from './pages/musicbill_collection';
import Exploration from './pages/exploration';
import MusicPlayRecord from './pages/music_play_record';

function Wrapper() {
  const profile = p.useState();
  return (
    <Routes>
      <Route path={PLAYER_PATH.SEARCH} element={<Search />} />
      <Route path={PLAYER_PATH.EXPLORATION} element={<Exploration />} />
      <Route path={PLAYER_PATH.MY_MUSIC} element={<MyMusic />} />
      <Route path={PLAYER_PATH.MY_SINGER} element={<MySinger />} />
      <Route path={PLAYER_PATH.MUSICBILL} element={<Musicbill />} />
      <Route path={PLAYER_PATH.SETTING} element={<Setting />} />
      <Route
        path={PLAYER_PATH.MUSICBILL_COLLECTION}
        element={<MusicbillCollection />}
      />
      <Route
        path={PLAYER_PATH.MUSIC_PLAY_RECORD}
        element={<MusicPlayRecord />}
      />

      {profile?.admin ? (
        <Route path={PLAYER_PATH.USER_MANAGE} element={<UserManage />} />
      ) : null}

      <Route
        path="*"
        element={<Navigate to={PLAYER_PATH.EXPLORATION} replace />}
      />
    </Routes>
  );
}

export default Wrapper;
