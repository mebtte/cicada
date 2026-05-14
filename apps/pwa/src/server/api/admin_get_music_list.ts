import { MusicType } from '@/constants/music';
import { prefixServerOrigin } from '@/global_states/server';
import { request } from '..';

export enum AdminMusicListFilterKey {
  ALL = 'all',
  ID = 'id',
  NAME = 'name',
  ALIAS = 'alias',
  SINGER = 'singer',
}

export enum AdminMusicListSortBy {
  CREATE_TIMESTAMP = 'createTimestamp',
  HEAT = 'heat',
}

export enum AdminMusicListSortOrder {
  DESC = 'desc',
  ASC = 'asc',
}

type Response = {
  total: number;
  musicList: {
    id: string;
    type: MusicType;
    name: string;
    aliases: string[];
    cover: string;
    asset: string;
    assetSize: number;
    assetDurationMs: number;
    assetCodec: string;
    assetBitRate: number;
    heat: number;
    year: number | null;
    singers: {
      id: string;
      name: string;
      aliases: string[];
    }[];
    createUser: {
      id: string;
      username: string;
      nickname: string;
    };
    createTimestamp: number;
  }[];
};

async function adminGetMusicList({
  page,
  pageSize,
  keyword,
  filterKey,
  sortBy,
  sortOrder,
  requestMinimalDuration,
}: {
  page: number;
  pageSize: number;
  keyword: string;
  filterKey: AdminMusicListFilterKey;
  sortBy?: AdminMusicListSortBy;
  sortOrder?: AdminMusicListSortOrder;
  requestMinimalDuration?: number;
}) {
  const data = await request<Response>({
    path: '/api/admin/music_list',
    params: {
      page,
      pageSize,
      keyword,
      filterKey,
      sortBy,
      sortOrder,
    },
    withToken: true,
    requestMinimalDuration,
  });
  return {
    ...data,
    musicList: data.musicList.map((music) => ({
      ...music,
      cover: prefixServerOrigin(music.cover),
      asset: prefixServerOrigin(music.asset),
    })),
  };
}

export default adminGetMusicList;
