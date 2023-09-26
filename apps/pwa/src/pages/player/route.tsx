import { Routes, Route, Navigate } from 'react-router-dom';
import { PLAYER_PATH } from '@/constants/route';
import { useUser } from '@/global_states/server';
import Search from './pages/search';
import Musicbill from './pages/musicbill';
import Setting from './pages/setting';
import MyMusic from './pages/my_music';
import UserManage from './pages/user_manage';
import PublicMusicbillCollection from './pages/public_musicbill_collection';
import Exploration from './pages/exploration';
import MusicPlayRecord from './pages/music_play_record';
import SharedMusicbillInvitation from './pages/shared_musicbill_invitation';

function Wrapper() {
  const user = useUser()!;
  return (
    <Routes>
      <Route path={PLAYER_PATH.SEARCH} element={<Search />} />
      <Route path={PLAYER_PATH.EXPLORATION} element={<Exploration />} />
      <Route path={PLAYER_PATH.MY_MUSIC} element={<MyMusic />} />
      <Route path={PLAYER_PATH.MUSICBILL} element={<Musicbill />} />
      <Route path={PLAYER_PATH.SETTING} element={<Setting />} />
      <Route
        path={PLAYER_PATH.SHARED_MUSICBILL_INVITATION}
        element={<SharedMusicbillInvitation />}
      />
      <Route
        path={PLAYER_PATH.PUBLIC_MUSICBILL_COLLECTION}
        element={<PublicMusicbillCollection />}
      />
      <Route
        path={PLAYER_PATH.MUSIC_PLAY_RECORD}
        element={<MusicPlayRecord />}
      />

      {user.admin ? (
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
