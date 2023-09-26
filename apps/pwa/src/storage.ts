import Storage from '@/utils/storage';
import { Setting } from '@/constants/setting';
import { ServerState } from './constants/server';

export enum Key {
  SETTING = 'setting_v3',
  SERVER = 'server',
}

const storage = new Storage<
  Key,
  {
    [Key.SETTING]: Setting;
    [Key.SERVER]: ServerState;
  }
>('app');

// @ts-expect-error
window.appStorage = storage;

export default storage;
