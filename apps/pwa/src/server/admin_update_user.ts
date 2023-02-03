import { AdminAllowUpdateKey } from '#/constants/user';
import { Method, request } from '.';

type KeyMapValue = {
  [AdminAllowUpdateKey.REMARK]: string;
  [AdminAllowUpdateKey.ADMIN]: null;
  [AdminAllowUpdateKey.EMAIL]: string;
};

function adminUpdateUser<Key extends AdminAllowUpdateKey>({
  id,
  key,
  value,
}: {
  id: string;
  key: Key;
  value: KeyMapValue[Key];
}) {
  return request<void>({
    path: '/api/admin/user',
    method: Method.PUT,
    body: {
      id,
      key,
      value,
    },
    withToken: true,
  });
}

export default adminUpdateUser;
