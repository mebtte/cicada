/* eslint-disable camelcase */
import api from '.';

/**
 * CMS 创建角色
 * @author mebtte<hi@mebtte.com>
 */
function cmsCreateFigure(name: string) {
  return api.post<void>('/api/cms/create_figure', {
    data: { name },
    withToken: true,
  });
}

export default cmsCreateFigure;
