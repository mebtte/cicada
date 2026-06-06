import { matchPath } from 'react-router-dom';
import { PLAYER_PATH, ROOT_PATH } from '../../../constants/route.js';

const BACK_BUTTON_PLAYER_PATH_LIST = [
  PLAYER_PATH.MUSIC,
  PLAYER_PATH.ARTIST,
];

const getPlayerRelativePathname = (pathname: string) => {
  if (pathname === ROOT_PATH.PLAYER) {
    return PLAYER_PATH.EXPLORATION;
  }
  if (pathname.startsWith(`${ROOT_PATH.PLAYER}/`)) {
    return pathname.slice(ROOT_PATH.PLAYER.length);
  }
  return pathname;
};

export const getIsHeaderBackButtonPath = (pathname: string) =>
  BACK_BUTTON_PLAYER_PATH_LIST.some((path) => {
    const absolutePath = `${ROOT_PATH.PLAYER}${path}`;

    return (
      !!matchPath({ path: absolutePath, end: true }, pathname) ||
      !!matchPath(
        { path, end: true },
        getPlayerRelativePathname(pathname),
      )
    );
  });
