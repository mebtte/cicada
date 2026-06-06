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
    asset: string;
    singers: {
      id: string;
      name: string;
      aliases: string[];
    }[];
    lyricists: {
      id: string;
      name: string;
      aliases: string[];
    }[];
    lyrics: {
      id: number;
      lrc: string;
    }[];
  }[];
};

type RawResponse = Omit<Response, 'musicList'> & {
  musicList: (Omit<Response['musicList'][number], 'lyrics'> & {
    lyrics?: Response['musicList'][number]['lyrics'];
  })[];
};

/**
 * 通过歌词搜索音乐
 * @author mebtte<i@mebtte.com>
 */
async function searchMusicByLyric({
  keyword,
  page,
  pageSize,
}: {
  keyword: string;
  page: number;
  pageSize: number;
}) {
  const data = await request<RawResponse>({
    path: '/api/music/search_by_lyric',
    params: { keyword, page, pageSize },
    withToken: true,
  });
  return {
    ...data,
    musicList: data.musicList.map((m) => ({
      ...m,
      asset: prefixServerOrigin(m.asset),
      cover: prefixServerOrigin(m.cover),
      lyricists: m.lyricists ?? [],
      lyrics: m.lyrics ?? [],
    })),
  };
}

export default searchMusicByLyric;
