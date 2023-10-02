import { useLocation } from 'react-router-dom';
import { PLAYER_PATH, ROOT_PATH } from '@/constants/route';
import { t } from '@/i18n';

export default () => {
  const { pathname } = useLocation();

  let title: string;
  switch (pathname) {
    case ROOT_PATH.PLAYER:
    case ROOT_PATH.PLAYER + PLAYER_PATH.EXPLORATION: {
      title = t('exploration');
      break;
    }
    case ROOT_PATH.PLAYER + PLAYER_PATH.SEARCH: {
      title = t('search');
      break;
    }
    case ROOT_PATH.PLAYER + PLAYER_PATH.MY_MUSIC: {
      title = t('my_music');
      break;
    }
    case ROOT_PATH.PLAYER + PLAYER_PATH.USER_MANAGE: {
      title = t('user_management');
      break;
    }
    case ROOT_PATH.PLAYER + PLAYER_PATH.SETTING: {
      title = t('setting');
      break;
    }
    case ROOT_PATH.PLAYER + PLAYER_PATH.SHARED_MUSICBILL_INVITATION: {
      title = t('shared_musicbill_invitation');
      break;
    }
    case ROOT_PATH.PLAYER + PLAYER_PATH.PUBLIC_MUSICBILL_COLLECTION: {
      title = t('public_musicbill_collection');
      break;
    }
    case ROOT_PATH.PLAYER + PLAYER_PATH.MUSIC_PLAY_RECORD: {
      title = t('music_play_record_short');
      break;
    }
    default: {
      title = t('cicada');
    }
  }

  return title;
};
