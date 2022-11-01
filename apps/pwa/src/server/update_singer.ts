import { AllowUpdateKey } from '#/constants/singer';
import { request, Method } from '.';

type KeyMapData = {
  [AllowUpdateKey.NAME]: string;
  [AllowUpdateKey.ALIASES]: string[];
  [AllowUpdateKey.AVATAR]: string;
};

function updateSinger<K extends AllowUpdateKey>({
  id,
  key,
  value,
}: {
  id: string;
  key: K;
  value: KeyMapData[K];
}) {
  return request({
    path: '/api/singer',
    method: Method.PUT,
    withToken: true,
    body: { id, key, value },
  });
}

export default updateSinger;
