import { Routes, Route } from 'react-router-dom';
import { PLAYER_PATH } from '@/constants/route';
import Home from './pages/home';
import Search from './pages/search';
import Musicbill from './pages/musicbill';
import Setting from './pages/setting';
import MyMusic from './pages/my_music';
import MySinger from './pages/my_singer';
import Super from './pages/super';

function Wrapper() {
  return (
    <Routes>
      <Route path={PLAYER_PATH.SEARCH} element={<Search />} />
      <Route path={PLAYER_PATH.MY_MUSIC} element={<MyMusic />} />
      <Route path={PLAYER_PATH.MY_SINGER} element={<MySinger />} />
      <Route path={PLAYER_PATH.MUSICBILL} element={<Musicbill />} />
      <Route path={PLAYER_PATH.SUPER} element={<Super />} />
      <Route path={PLAYER_PATH.SETTING} element={<Setting />} />
      <Route path="*" element={<Home />} />
    </Routes>
  );
}

export default Wrapper;
