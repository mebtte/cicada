import { AllowUpdateKey } from '#/constants/music';
import { Method, request } from '..';

type KeyMapValue = {
  [AllowUpdateKey.COVER]: string;
  [AllowUpdateKey.NAME]: string;
  [AllowUpdateKey.LYRIC]: string[];
  [AllowUpdateKey.ALIASES]: string[];
  [AllowUpdateKey.ASSET]: string;
  [AllowUpdateKey.SINGER]: string[];
  [AllowUpdateKey.FORK_FROM]: string[];
  [AllowUpdateKey.YEAR]: number;
};

function updateMusic<Key extends AllowUpdateKey>({
  id,
  key,
  value,
  requestMinimalDuration,
}: {
  id: string;
  key: Key;
  value: KeyMapValue[Key];
  requestMinimalDuration?: number;
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
    requestMinimalDuration,
  });
}

export default updateMusic;
