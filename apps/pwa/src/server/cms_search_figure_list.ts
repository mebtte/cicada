/* eslint-disable camelcase */
import api from '.';

export const KEYWORD_MAX_LENGTH = 50;

/**
 * CMS 搜索角色列表
 * @author mebtte<hi@mebtte.com>
 */
async function cmsSearchFigureList({
  keyword,
  size = 30,
}: {
  keyword: string;
  size?: number;
}) {
  const figureList = await api.get<
    {
      id: string;
      avatar: string;
      name: string;
      alias: string;
      create_time: string;
    }[]
  >('/api/cms/search_figure_list', {
    params: { keyword, size },
    withToken: true,
  });
  return figureList.map(
    ({ id, name, alias, avatar, create_time: createTime }) => ({
      id,
      name,
      alias,
      avatar,
      createTime: new Date(createTime),
    }),
  );
}

export default cmsSearchFigureList;
