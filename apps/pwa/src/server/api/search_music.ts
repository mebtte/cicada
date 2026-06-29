import { MusicType } from '@/constants/music';
import { prefixServerOrigin } from '@/global_states/server';
import { request } from '..';

type Response = {
  total: number;
  musicList: {
    id: string;
    type: MusicType;
    name: string;
    aliases: string[];
    cover: string;
    coverThumbnail?: string;
    asset: string;
    performers: {
      id: string;
      name: string;
      aliases: string[];
    }[];
    lyricists: {
      id: string;
      name: string;
      aliases: string[];
    }[];
    composers: {
      id: string;
      name: string;
      aliases: string[];
    }[];
  }[];
};

async function searchMusic({
  keyword,
  page,
  pageSize,
}: {
  keyword: string;
  page: number;
  pageSize: number;
}) {
  const result = await request<Response>({
    path: '/api/common/music/search',
    params: { keyword, page, pageSize },
    withToken: true,
  });
  return {
    ...result,
    musicList: result.musicList.map((m) => ({
      ...m,
      cover: prefixServerOrigin(m.cover),
      coverThumbnail: prefixServerOrigin(m.coverThumbnail ?? ''),
      asset: prefixServerOrigin(m.asset),
      lyricists: m.lyricists ?? [],
      composers: m.composers ?? [],
    })),
  };
}

export default searchMusic;
