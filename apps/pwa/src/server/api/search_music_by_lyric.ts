import SearchMusicByLyric from '#/response_data/api/search_music_by_lyric';
import { prefixServerOrigin } from '@/global_states/setting';
import { request } from '..';

/**
 * 通过歌词搜索音乐
 * @author mebtte<hi@mebtte.com>
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
  const data = await request<SearchMusicByLyric>({
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
    })),
  };
}

export default searchMusicByLyric;
