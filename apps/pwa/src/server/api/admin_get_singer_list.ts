import { request } from '..';
import { prefixServerOrigin } from '@/global_states/server';

export enum AdminSingerListFilterKey {
  ALL = 'all',
  ID = 'id',
  NAME = 'name',
  ALIAS = 'alias',
}

type Response = {
  total: number;
  singerList: {
    id: string;
    name: string;
    aliases: string[];
    photos: {
      id: string;
      asset: string;
      description: string;
    }[];
    createUser: {
      id: string;
      username: string;
      nickname: string;
    };
    createTimestamp: number;
  }[];
};

async function adminGetSingerList({
  page,
  pageSize,
  keyword,
  filterKey,
  requestMinimalDuration,
}: {
  page: number;
  pageSize: number;
  keyword: string;
  filterKey: AdminSingerListFilterKey;
  requestMinimalDuration?: number;
}) {
  const data = await request<Response>({
    path: '/api/admin/singer_list',
    params: {
      page,
      pageSize,
      keyword,
      filterKey,
    },
    withToken: true,
    requestMinimalDuration,
  });
  return {
    ...data,
    singerList: data.singerList.map((singer) => ({
      ...singer,
      photos: singer.photos.map((photo) => ({
        ...photo,
        asset: prefixServerOrigin(photo.asset),
      })),
    })),
  };
}

export default adminGetSingerList;
