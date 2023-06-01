import { AdminAllowUpdateKey } from '#/constants/user';
import { Method, request } from '..';

type KeyMapValue = {
  [AdminAllowUpdateKey.REMARK]: string;
  [AdminAllowUpdateKey.EMAIL]: string;
  [AdminAllowUpdateKey.MUSICBILL_MAX_AMOUNT]: number;
  [AdminAllowUpdateKey.CREATE_MUSIC_MAX_AMOUNT_PER_DAY]: number;
  [AdminAllowUpdateKey.MUSIC_PLAY_RECORD_INDATE]: number;
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
