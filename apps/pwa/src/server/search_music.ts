/* eslint-disable camelcase */
import { MusicType } from '@/constants/music';
import api from '.';

export const KEYWORD_MAX_LENGTH = 50;

async function searchMusic({
  keyword,
  page = 1,
  pageSize = 30,
}: {
  keyword: string;
  page?: number;
  pageSize?: number;
}) {
  return api.get<{
    total: number;
    list: {
      id: string;
      cover: string;
      name: string;
      type: MusicType;
      alias: string;
      ac: string;
      hq: string;
      mv_link: string;
      sq: string;
      singers: {
        id: string;
        name: string;
        avatar: string;
        alias: string;
      }[];
      fork?: string[];
      fork_from?: string[];
    }[];
  }>('/api/search_music', {
    params: {
      keyword,
      page,
      page_size: pageSize,
    },
    withToken: true,
  });
}

export default searchMusic;
