/* eslint-disable camelcase */
import server from '.';

/**
 * 获取用户详情
 * @author mebtte<hi@mebtte.com>
 */
function getUserDetail(id: string) {
  return server.get<{
    id: string;
    nickname: string;
    avatar: string;
    condition: string;
    join_time: string;
    musicbill_list: {
      cover: string;
      description: string;
      id: string;
      name: string;
    }[];
  }>('/api/get_user_detail', {
    withToken: true,
    params: { id },
  });
}

export default getUserDetail;
