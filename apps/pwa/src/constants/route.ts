export const ROOT_PATH = {
  HOME: '/',
  LOGIN: '/login',
  PLAYER: '/player',
  DESKTOP_CONFIGURE: '/desktop_configure',
};

export const PLAYER_PATH = {
  HOME: ROOT_PATH.PLAYER,
  MUSICBILL: `${ROOT_PATH.PLAYER}/musicbill/:id`,
  PUBLIC_MUSICBILL: `${ROOT_PATH.PLAYER}/public_musicbill`,
  SETTING: `${ROOT_PATH.PLAYER}/setting`,
  SEARCH: `${ROOT_PATH.PLAYER}/search`,
};
