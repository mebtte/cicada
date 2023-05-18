import { request } from '..';

/**
 * 获取音乐播放记录列表
 * @author mebtte<hi@mebtte.com>
 */
function getMusicPlayRecordList({
  page,
  pageSize,
  keyword,
}: {
  page: number;
  pageSize: number;
  keyword: string;
}) {
  return request<{
    total: number;
    musicPlayRecordList: {
      recordId: number;
      percent: number;
      timestamp: number;

      id: string;

      name: string;
      aliases: string[];
      singers: {
        id: string;
        name: string;
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
}

export default getMusicPlayRecordList;
