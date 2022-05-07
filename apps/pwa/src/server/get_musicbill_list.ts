/* eslint-disable camelcase */
import api from '.';

/**
 * 获取歌单列表
 * @author mebtte<hi@mebtte.com>
 */
function getMusicbillList() {
  return api.get<
    {
      id: string;
      name: string;
      description: string;
      order: number;
      create_time: string;
      cover: string;
      public: 0 | 1;
    }[]
  >('/api/get_musicbill_list', { withToken: true });
}

export default getMusicbillList;
