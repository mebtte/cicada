/* eslint-disable camelcase */
import { MusicType } from '@/constants/music';
import api from '.';

export enum SearchKey {
  COMPOSITE = 'composite',
  ID = 'id',
  NAME = 'name',
  ALIAS = 'alias',
  SINGER_ID = 'singer_id',
  SINGER_NAME = 'singer_name',
}

export const SEARCH_KEY_MAP_LABEL: Record<SearchKey, string> = {
  [SearchKey.COMPOSITE]: '综合',
  [SearchKey.ID]: '音乐ID',
  [SearchKey.NAME]: '音乐名',
  [SearchKey.ALIAS]: '音乐别名',
  [SearchKey.SINGER_ID]: '歌手 ID',
  [SearchKey.SINGER_NAME]: '歌手名',
};

export const SEARCH_KEYS = Object.keys(SEARCH_KEY_MAP_LABEL);
export const SEARCH_VALUE_MAX_LENGTH = 50;

function cmsGetMusicList({
  page = 1,
  pageSize = 30,
  searchKey,
  searchValue,
}: {
  page?: number;
  pageSize?: number;
  searchKey: SearchKey;
  searchValue: string;
}) {
  return api.get<{
    total: number;
    list: {
      id: string;
      cover: string;
      name: string;
      alias: string;
      type: MusicType;
      singers: {
        id: string;
        avatar: string;
        name: string;
        alias: string;
      }[];
      create_time: string;
      sq: string;
      hq: string;
      ac: string;
      mv_link: string;
      fork_from?: string[];
      recommendable: 0 | 1;
    }[];
  }>('/api/cms/get_music_list', {
    withToken: true,
    defer: 0,
    params: {
      page,
      page_size: pageSize,
      search_key: searchKey,
      search_value: searchValue,
    },
  });
}

export default cmsGetMusicList;
