import { MusicType } from '#/constants/music';
import { prefixServerOrigin } from '@/global_states/setting';
import { request } from '.';

/**
 * 获取音乐播放记录列表
 * @author mebtte<hi@mebtte.com>
 */
async function getMusicPlayRecordList({
  page,
  pageSize,
  keyword,
}: {
  page: number;
  pageSize: number;
  keyword: string;
}) {
  const data = await request<{
    total: number;
    musicPlayRecordList: {
      recordId: number;
      percent: number;
      timestamp: number;

      id: string;
      cover: string;
      type: MusicType;
      name: string;
      aliases: string[];
      asset: string;
      singers: {
        id: string;
        name: string;
        aliases: string[];
      }[];
    }[];
  }>({
    path: '/api/music_play_record_list',
    params: {
      page,
      pageSize,
      keyword,
    },
    withToken: true,
  });
  return {
    ...data,
    musicPlayRecordList: data.musicPlayRecordList.map((m) => ({
      ...m,
      cover: prefixServerOrigin(m.cover),
      asset: prefixServerOrigin(m.asset),
    })),
  };
}

export default getMusicPlayRecordList;
