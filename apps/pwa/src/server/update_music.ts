import { AllowUpdateKey } from '#/constants/music';
import { Method, request } from '.';

type KeyMapValue = {
  [AllowUpdateKey.COVER]: string;
};

function updateMusic<Key extends AllowUpdateKey>({
  id,
  key,
  value,
}: {
  id: string;
  key: Key;
  value: KeyMapValue[Key];
}) {
  return request({
    path: '/api/music',
    method: Method.PUT,
    body: {
      id,
      key,
      value,
    },
    withToken: true,
  });
}

export default updateMusic;
