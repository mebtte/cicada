import XState from '@/utils/x_state';
import storage, { Key } from '@/storage';
import { Profile } from '@/constants/user';
import logger from '@/utils/logger';
import token from './token';

const initialProfile: Profile | null = await storage.getItem(Key.PROFILE);
const profile = new XState<Profile | null>(token.get() ? initialProfile : null);

profile.onChange((p) => {
  if (p) {
    storage
      .setItem(Key.PROFILE, p)
      .catch((error) => logger.error(error, '保存个人资料失败'));
  } else {
    storage
      .removeItem(Key.PROFILE)
      .catch((error) => logger.error(error, '移除个人资料失败'));
  }
});
token.onChange((t) => (t ? null : profile.set(null)));

export default profile;
