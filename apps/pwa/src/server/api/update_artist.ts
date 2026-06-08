import { AllowUpdateKey } from '@/constants/artist';
import { request, Method } from '..';

type KeyMapData = {
  [AllowUpdateKey.NAME]: string;
  [AllowUpdateKey.ALIASES]: string[];
  [AllowUpdateKey.SEARCH_KEYWORDS]: string;
};

function updateArtist<K extends AllowUpdateKey>({
  id,
  key,
  value,
}: {
  id: string;
  key: K;
  value: KeyMapData[K];
}) {
  return request({
    path: '/api/admin/artist',
    method: Method.PUT,
    withToken: true,
    body: { id, key, value },
  });
}

export default updateArtist;
