import XState from '#/utils/x_state';
import storage, { Key } from '@/storage';
import { Profile } from '@/constants/user';
import logger from '#/utils/logger';
import token from './token';

const initialProfile: Profile | null = await storage.getItem(Key.PROFILE);
const user = new XState<Profile | null>(token.get() ? initialProfile : null);

user.onChange((u) => {
  if (u) {
    storage
      .setItem(Key.PROFILE, u)
      .catch((error) => logger.error(error, '保存个人资料失败'));
  } else {
    storage
      .removeItem(Key.PROFILE)
      .catch((error) => logger.error(error, '移除个人资料失败'));
  }
});
token.onChange((t) => (t ? null : user.set(null)));

export default user;
