import { MusicType } from '#/constants/music';
import { request } from '.';

function searchMusicByLyric({
  keyword,
  page,
  pageSize,
}: {
  keyword: string;
  page: number;
  pageSize: number;
}) {
  return request<{
    total: number;
    musicList: {
      id: string;
      type: MusicType;
      name: string;
      aliases: string[];
      cover: string;
      sq: string;
      hq: string;
      ac: string;
      singers: {
        id: string;
        name: string;
        aliases: string[];
      }[];
      lyrics: {
        id: number;
        lrc: string;
      }[];
    }[];
  }>({
    path: '/api/music/search_by_lyric',
    params: { keyword, page, pageSize },
    withToken: true,
  });
}

export default searchMusicByLyric;
