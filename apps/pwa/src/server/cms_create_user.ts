import api from '.';

/**
 * CMS 创建用户
 * @author mebtte<hi@mebtte.com>
 */
function cmsCreateUser({
  email,
  nickname,
  remark,
}: {
  email: string;
  nickname: string;
  remark: string;
}) {
  return api.post<void>('/api/cms/create_user', {
    withToken: true,
    data: { email, nickname, remark },
  });
}

export default cmsCreateUser;
