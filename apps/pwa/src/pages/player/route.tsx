import { useEffect, useState } from 'react';
import {
  Routes,
  Route,
  Navigate,
  matchPath,
  useLocation,
  type Location,
} from 'react-router-dom';
import styled from 'styled-components';
import { PLAYER_PATH, ROOT_PATH } from '@/constants/route';
import Search from './pages/search';
import Musicbill from './pages/musicbill';
import Music from './pages/music';
import User from './pages/user';
import Setting from './pages/setting';
import PublicMusicbillCollection from './pages/public_musicbill_collection';
import Exploration from './pages/exploration';
import MusicPlayRecord from './pages/music_play_record';
import SharedMusicbillInvitation from './pages/shared_musicbill_invitation';
import ExportingMusic from './pages/exporting_music';
import Singer from './pages/singer';

const Style = styled.div`
  flex: 1;
  min-height: 0;
  position: relative;
`;
const SearchLayer = styled.div`
  position: absolute;
  inset: 0;
`;

const getIsSearchPath = (pathname: string) =>
  !!matchPath(`${ROOT_PATH.PLAYER}${PLAYER_PATH.SEARCH}`, pathname);
const getIsSingerPath = (pathname: string) =>
  !!matchPath(`${ROOT_PATH.PLAYER}${PLAYER_PATH.SINGER}`, pathname);

function Wrapper() {
  const location = useLocation();
  const isSearchPath = getIsSearchPath(location.pathname);
  const isSingerPath = getIsSingerPath(location.pathname);
  const [searchLocation, setSearchLocation] = useState<Location | null>(
    isSearchPath ? location : null,
  );

  useEffect(() => {
    if (isSearchPath) {
      setSearchLocation(location);
      return;
    }
    if (!isSingerPath) {
      setSearchLocation(null);
    }
  }, [isSearchPath, isSingerPath, location]);

  const keepSearchAlive = isSearchPath || (isSingerPath && !!searchLocation);
  const renderedSearchLocation = isSearchPath ? location : searchLocation;

  return (
    <Style>
      {keepSearchAlive && renderedSearchLocation ? (
        <SearchLayer>
          <Routes location={renderedSearchLocation}>
            <Route path={PLAYER_PATH.SEARCH} element={<Search />} />
          </Routes>
        </SearchLayer>
      ) : null}
      {isSearchPath ? null : (
        <Routes>
          <Route path={PLAYER_PATH.SEARCH} element={<Search />} />
          <Route path={PLAYER_PATH.EXPLORATION} element={<Exploration />} />
          <Route path={PLAYER_PATH.MUSIC} element={<Music />} />
          <Route path={PLAYER_PATH.MUSICBILL} element={<Musicbill />} />
          <Route path={PLAYER_PATH.SINGER} element={<Singer />} />
          <Route path={PLAYER_PATH.USER} element={<User />} />
          <Route path={PLAYER_PATH.SETTING} element={<Setting />} />
          <Route
            path={PLAYER_PATH.EXPORTING_MUSIC}
            element={<ExportingMusic />}
          />
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

          <Route
            path="*"
            element={<Navigate to={PLAYER_PATH.EXPLORATION} replace />}
          />
        </Routes>
      )}
    </Style>
  );
}

export default Wrapper;
