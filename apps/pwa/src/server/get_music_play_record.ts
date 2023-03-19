import { request } from '.';

/**
 * 获取音乐播放记录
 * @author mebtte<hi@mebtte.com>
 */
function getMusicPlayRecord({
  page,
  pageSize,
  keyword,
}: {
  page: number;
  pageSize: number;
  keyword: string;
}) {
  return request<
    {
      id: string;
      percent: number;
    }[]
  >({
    path: '/api/music_play_record',
    params: {
      page,
      pageSize,
      keyword,
    },
    withToken: true,
  });
}

export default getMusicPlayRecord;
