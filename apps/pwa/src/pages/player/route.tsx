import { Routes, Route } from 'react-router-dom';
import { PLAYER_PATH } from '@/constants/route';
import Home from './pages/home';
import Search from './pages/search';
import Musicbill from './pages/musicbill';
import Setting from './pages/setting';

function Wrapper() {
  return (
    <Routes>
      <Route path={PLAYER_PATH.SEARCH} element={<Search />} />
      <Route path={PLAYER_PATH.MUSICBILL} element={<Musicbill />} />
      <Route path={PLAYER_PATH.SETTING} element={<Setting />} />
      <Route path="*" element={<Home />} />
    </Routes>
  );
}

export default Wrapper;
