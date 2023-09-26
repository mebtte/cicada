import { MusicType } from '#/constants/music';
import { prefixServerOrigin } from '@/global_states/server';
import { request } from '..';

/**
 * 获取音乐列表
 * @author mebtte<hi@mebtte.com>
 */
async function getMusicList({
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
      cover: string;
      type: MusicType;
      name: string;
      aliases: string[];
      heat: number;
      asset: string;
      singers: {
        id: string;
        name: string;
        aliases: string[];
      }[];
      createTimestamp: number;
    }[];
  }>({
    path: '/api/music_list',
    params: { keyword, page, pageSize },
    withToken: true,
  });
  return {
    ...data,
    musicList: data.musicList.map((m) => ({
      ...m,
      cover: prefixServerOrigin(m.cover),
      asset: prefixServerOrigin(m.asset),
    })),
  };
}

export default getMusicList;
