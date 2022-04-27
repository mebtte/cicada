/* eslint-disable camelcase */
import api from '.';

/**
 * 获取用户
 * @author mebtte<hi@mebtte.com>
 */
function getUser() {
  return api.get<{
    id: string;
    email: string;
    avatar: string;
    join_time: string;
    nickname: string;
    condition: string;
    cms: number;
  }>('/api/get_user', {
    withToken: true,
  });
}

export default getUser;
