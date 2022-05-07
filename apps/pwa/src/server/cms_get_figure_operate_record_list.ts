/* eslint-disable camelcase */
import api from '.';

/**
 * CMS 获取角色操作记录列表
 * @author mebtte<hi@mebtte.com>
 */
function cmsGetFigureOperateRecordList({
  figureId,
  page = 1,
  pageSize = 20,
}: {
  figureId?: string;
  page?: number;
  pageSize?: number;
} = {}) {
  return api.get<{
    total: number;
    list: {
      id: number;
      type: 'create' | 'modify';
      operate_user: { id: string; nickname: string };
      figure_id: string;
      content: string;
      operate_time: string;
    }[];
  }>('/api/cms/get_figure_operate_record_list', {
    withToken: true,
    params: { figure_id: figureId, page, page_size: pageSize },
  });
}

export default cmsGetFigureOperateRecordList;
