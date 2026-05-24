import Storage from '@/utils/storage';
import { Setting } from '@/constants/setting';
import { ServerState } from './constants/server';
import { Position } from './constants';

export enum Key {
  CUSTOM_APP_NAME = 'custom_app_name',

  SETTING = 'setting_v4',
  SERVER = 'server',

  DOWNLOAD_FLOATING_POSITION = 'download-floating-position',
}

const storage = new Storage<
  Key,
  {
    [Key.CUSTOM_APP_NAME]: string;
    [Key.SETTING]: Setting;
    [Key.SERVER]: ServerState;
    [Key.DOWNLOAD_FLOATING_POSITION]: Position;
  }
>('app');

// @ts-expect-error: for debug
window.appStorage = storage;

export default storage;
