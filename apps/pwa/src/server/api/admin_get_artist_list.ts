import { request } from '..';
import { prefixServerOrigin } from '@/global_states/server';

export enum AdminArtistListFilterKey {
  ALL = 'all',
  ID = 'id',
  NAME = 'name',
  ALIAS = 'alias',
}

type Response = {
  total: number;
  artistList: {
    id: string;
    name: string;
    aliases: string[];
    searchKeywords: string;
    photos: {
      id: string;
      asset: string;
      thumbnail?: string;
      description: string;
    }[];
    musicCount: number;
    createUser: {
      id: string;
      username: string;
      nickname: string;
    };
    createTimestamp: number;
  }[];
};

async function adminGetArtistList({
  page,
  pageSize,
  keyword,
  filterKey,
  requestMinimalDuration,
}: {
  page: number;
  pageSize: number;
  keyword: string;
  filterKey: AdminArtistListFilterKey;
  requestMinimalDuration?: number;
}) {
  const data = await request<Response>({
    path: '/api/admin/artist_list',
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
    artistList: data.artistList.map((artist) => ({
      ...artist,
      searchKeywords: artist.searchKeywords ?? '',
      photos: artist.photos.map((photo) => ({
        ...photo,
        asset: prefixServerOrigin(photo.asset),
        thumbnail: prefixServerOrigin(photo.thumbnail ?? ''),
      })),
    })),
  };
}

export default adminGetArtistList;
