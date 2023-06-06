import { AllowUpdateKey } from '#/constants/musicbill';
import { request, Method } from '..';

type AllowUpdateKeyMapValue = {
  [AllowUpdateKey.COVER]: string;
  [AllowUpdateKey.NAME]: string;
  [AllowUpdateKey.PUBLIC]: boolean;
};

function updateMusicbill<K extends AllowUpdateKey>({
  id,
  key,
  value,
}: {
  id: string;
  key: K;
  value: AllowUpdateKeyMapValue[K];
}) {
  return request({
    method: Method.PUT,
    path: '/api/musicbill',
    body: { id, key, value },
    withToken: true,
  });
}

export default updateMusicbill;
