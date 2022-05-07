/* eslint-disable camelcase */
import api from '.';

/**
 * CMS 获取音乐操作记录列表
 * @author mebtte<hi@mebtte.com>
 */
function cmsGetMusicOperateRecordList({
  musicId,
  page = 1,
  pageSize = 20,
}: {
  musicId?: string;
  page?: number;
  pageSize?: number;
} = {}) {
  return api.get<{
    total: number;
    list: {
      id: number;
      type: 'create' | 'modify';
      operate_user: { id: string; nickname: string };
      music_id: string;
      content: string;
      operate_time: string;
    }[];
  }>('/api/cms/get_music_operate_record_list', {
    withToken: true,
    params: { music_id: musicId, page, page_size: pageSize },
  });
}

export default cmsGetMusicOperateRecordList;
