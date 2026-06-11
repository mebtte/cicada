import Storage from '@/utils/storage';
import { Setting } from '@/constants/setting';
import { MusicType } from '@/constants/music';
import { ServerState } from './constants/server';
import { Position } from './constants';

export interface OfflineMusic {
  id: string;
  /**
   * 服务端原始 asset (不含 quality 查询参数). 字节缓存按各音质单独存在 SW
   * CacheStorage 里, 数据层只记元数据 + 这个 asset, 与具体音质解耦.
   */
  asset: string;
  type: MusicType;
  name: string;
  aliases: string[];
  cover: string;
  coverThumbnail?: string;
  performers: { id: string; name: string; aliases: string[] }[];
  lyricists: { id: string; name: string; aliases: string[] }[];
  composers: { id: string; name: string; aliases: string[] }[];
  cachedAt: number;
}

export type OfflineMusicMap = Record<string, OfflineMusic>;

export enum Key {
  CUSTOM_APP_NAME = 'custom_app_name',

  SETTING = 'setting_v4',
  SERVER = 'server_v3',

  DOWNLOAD_FLOATING_POSITION = 'download-floating-position',
  OFFLINE_MUSIC = 'offline-music-v4',
  STORAGE_PERSISTENCE_REQUESTED = 'storage-persistence-requested',
}

const storage = new Storage<
  Key,
  {
    [Key.CUSTOM_APP_NAME]: string;
    [Key.SETTING]: Setting;
    [Key.SERVER]: ServerState;
    [Key.DOWNLOAD_FLOATING_POSITION]: Position;
    [Key.OFFLINE_MUSIC]: OfflineMusicMap;
    [Key.STORAGE_PERSISTENCE_REQUESTED]: boolean;
  }
>('app');

// @ts-expect-error: for debug
window.appStorage = storage;

export default storage;
