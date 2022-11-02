import { AllowUpdateKey } from '#/constants/music';
import { Method, request } from '.';

type KeyMapValue = {
  [AllowUpdateKey.COVER]: string;
  [AllowUpdateKey.NAME]: string;
  [AllowUpdateKey.LYRIC]: string[];
  [AllowUpdateKey.ALIASES]: string[];
  [AllowUpdateKey.SQ]: string;
  [AllowUpdateKey.HQ]: string;
  [AllowUpdateKey.AC]: string;
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
