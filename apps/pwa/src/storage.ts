import Storage from '@/utils/storage';
import { Setting } from '@/constants/setting';
import { Profile } from '@/constants/user';
import { PlayMode } from '@/constants';

export enum Key {
  LAST_LOGIN_EMAIL = 'last_login_email',
  TOKEN = 'token',
  PROFILE = 'profile',
  SETTING = 'setting_v2',
  PLAYER_VOLUME = 'player_volume',
  PLAY_MODE = 'play_mode',
}

const storage = new Storage<
  Key,
  {
    [Key.LAST_LOGIN_EMAIL]: string;
    [Key.TOKEN]: string;
    [Key.PROFILE]: Profile;
    [Key.SETTING]: Setting;
    [Key.PLAYER_VOLUME]: number;
    [Key.PLAY_MODE]: PlayMode;
  }
>('app');

// @ts-expect-error
window.appStorage = storage;

export default storage;
