import { useLocation } from 'react-router-dom';
import { PLAYER_PATH, ROOT_PATH } from '@/constants/route';

export default () => {
  const { pathname } = useLocation();

  let title = '知了';
  switch (pathname) {
    case ROOT_PATH.PLAYER + PLAYER_PATH.SEARCH: {
      title = '搜索';
      break;
    }
    case ROOT_PATH.PLAYER + PLAYER_PATH.MY_MUSIC: {
      title = '我的音乐';
      break;
    }
    case ROOT_PATH.PLAYER + PLAYER_PATH.MY_SINGER: {
      title = '我的歌手';
      break;
    }
    case ROOT_PATH.PLAYER + PLAYER_PATH.SUPER: {
      title = '超级管理员';
      break;
    }
    case ROOT_PATH.PLAYER + PLAYER_PATH.SETTING: {
      title = '设置';
      break;
    }
  }

  return title;
};
