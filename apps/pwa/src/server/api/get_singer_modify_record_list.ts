import { Response } from '#/server/api/get_singer_modify_record_list';
import { request } from '..';

/**
 * 获取歌手修改记录列表
 * @author mebtte<hi@mebtte.com>
 */
function getSingerModifyRecordList({
  id,
  requestMinimalDuration,
}: {
  id: string;
  requestMinimalDuration?: number;
}) {
  return request<Response>({
    path: '/api/singer_modify_record_list',
    withToken: true,
    params: { id },
    requestMinimalDuration,
  });
}

export default getSingerModifyRecordList;
