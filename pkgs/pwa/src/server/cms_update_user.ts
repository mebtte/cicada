import api from '.';

export enum Key {
  REMARK = 'remark',
  DISABLED = 'disabled',
}

/**
 * CMS 更新用户
 * @author mebtte<hi@mebtte.com>
 */
function cmsUpdateUser({
  id,
  key,
  value,
}: {
  id: string;
  key: Key;
  value: string | number;
}) {
  return api.post<void>('/api/cms/update_user', {
    withToken: true,
    data: { id, key, value },
  });
}

export default cmsUpdateUser;
