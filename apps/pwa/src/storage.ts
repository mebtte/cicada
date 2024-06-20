import Storage from '@/utils/storage';
import { Setting } from '@/constants/setting';
import { ServerState } from './constants/server';

export enum Key {
  CUSTOM_APP_NAME = 'custom_app_name',

  SETTING = 'setting_v3',
  SERVER = 'server',
}

const storage = new Storage<
  Key,
  {
    [Key.CUSTOM_APP_NAME]: string;
    [Key.SETTING]: Setting;
    [Key.SERVER]: ServerState;
  }
>('app');

// @ts-expect-error: for debug
window.appStorage = storage;

export default storage;
