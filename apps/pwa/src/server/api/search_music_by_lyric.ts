import { MusicType } from '#/constants/music';
import { prefixServerOrigin } from '@/global_states/setting';
import { request } from '..';

async function searchMusicByLyric({
  keyword,
  page,
  pageSize,
}: {
  keyword: string;
  page: number;
  pageSize: number;
}) {
  const data = await request<{
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
  return {
    ...data,
    musicList: data.musicList.map((m) => ({
      ...m,
      cover: prefixServerOrigin(m.cover),
      sq: prefixServerOrigin(m.sq),
      hq: prefixServerOrigin(m.hq),
      ac: prefixServerOrigin(m.ac),
    })),
  };
}

export default searchMusicByLyric;
