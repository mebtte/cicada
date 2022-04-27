import { MusicType } from '@/constants/music';
import { Key } from '@/server/cms_update_music';

export interface Figure {
  id: string;
  name: string;
  alias: string;
}

export interface Music {
  id: string;
  cover: string;
  name: string;
  alias: string;
  type: MusicType;
  singers: Figure[];
  createTime: Date;
  sq: string;
  hq: string;
  ac: string;
  mvLink: string;
  forkFrom: string[];
  recommendable: boolean;
}

export enum Query {
  SEARCH_KEY = 'search_key',
  SEARCH_VALUE = 'search_value',
  PAGE = 'page',

  CREATE_DIALOG_OPEN = 'create_dialog_open',

  OPERATE_RECORD_DIALOG_OPEN = 'operate_record_dialog_open',
  OPERATE_RECORD_DIALOG_MUSIC_ID = 'operate_record_dialog_music_id',
}

export const PAGE_SIZE = 20;

export enum EditMusicResourceType {
  SQ = Key.SQ,
  HQ = Key.HQ,
  AC = Key.AC,
}
