import Storage from '@/utils/storage';
import { Setting } from '@/constants/setting';
import { Profile } from '@/constants/user';

export enum Key {
  TOKEN = 'token',
  PROFILE = 'profile',
  SETTING = 'setting_v3',
  PLAYER_VOLUME = 'player_volume',
}

const storage = new Storage<
  Key,
  {
    [Key.TOKEN]: string;
    [Key.PROFILE]: Profile;
    [Key.SETTING]: Setting;
    [Key.PLAYER_VOLUME]: number;
  }
>('app');

// @ts-expect-error
window.appStorage = storage;

export default storage;
