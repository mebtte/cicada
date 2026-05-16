import { AllowUpdateKey } from '@/constants/user';
import { request, Method } from '..';

type KeyMapData = {
  [AllowUpdateKey.NICKNAME]: string;
  [AllowUpdateKey.AVATAR]: string;
  [AllowUpdateKey.MUSICBILL_ORDERS]: string[];
  [AllowUpdateKey.PASSWORD]: {
    password: string;
    currentPassword?: string;
    twoFAToken?: string;
  };
};

function updateProfile<K extends AllowUpdateKey>({
  key,
  value,
}: {
  key: K;
  value: KeyMapData[K];
}) {
  return request({
    path: '/api/profile',
    method: Method.PUT,
    body: { key, value },
    withToken: true,
  });
}

export default updateProfile;
