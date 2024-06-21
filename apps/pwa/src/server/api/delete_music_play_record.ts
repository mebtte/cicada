import { request, Method } from '..';

/**
 * 删除音乐播放记录
 * @author mebtte<i@mebtte.com>
 */
function deleteMusicPlayRecord(id: number) {
  return request({
    path: '/api/music_play_record',
    method: Method.DELETE,
    params: { id },
    withToken: true,
  });
}

export default deleteMusicPlayRecord;
