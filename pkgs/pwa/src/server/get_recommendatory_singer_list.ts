/* eslint-disable camelcase */

import server from '.';

/**
 * 获取推荐音乐列表
 * @author mebtte<hi@mebtte.com>
 */
function getRecommendatorySingerList() {
  return server.get<
    {
      id: string;
      name: string;
      avatar: string;
      alias: string;
    }[]
  >('/api/get_recommendatory_singer_list', {
    withToken: true,
  });
}

export default getRecommendatorySingerList;
