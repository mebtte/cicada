import { Routes, Route } from 'react-router-dom';
import { PLAYER_PATH } from '@/constants/route';
import Search from './pages/search';
import Musicbill from './pages/musicbill';
import Setting from './pages/setting';
import MyMusic from './pages/my_music';
import MySinger from './pages/my_singer';
import Admin from './pages/admin';

function Wrapper() {
  return (
    <Routes>
      <Route
        path={PLAYER_PATH.SEARCH}
        element={<Search exploration={false} />}
      />
      <Route path={PLAYER_PATH.MY_MUSIC} element={<MyMusic />} />
      <Route path={PLAYER_PATH.MY_SINGER} element={<MySinger />} />
      <Route path={PLAYER_PATH.MUSICBILL} element={<Musicbill />} />
      <Route path={PLAYER_PATH.ADMIN} element={<Admin />} />
      <Route path={PLAYER_PATH.SETTING} element={<Setting />} />
      <Route path="*" element={<Search exploration />} />
    </Routes>
  );
}

export default Wrapper;
