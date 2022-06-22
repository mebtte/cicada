import XState from '#/utils/x_state';
import storage, { Key } from '@/platform/storage';
import token from './token';

export interface Profile {
  id: string;
  email: string;
  avatar: string;
  nickname: string;
  joinTimestamp: number;
  super: boolean;
}

let initialProfile: Profile | null = null;
const profileString = storage.getItem(Key.PROFILE);
if (profileString) {
  try {
    initialProfile = JSON.parse(profileString);
  } catch (error) {
    console.error(error);
  }
}

const user = new XState<Profile | null>(token.get() ? initialProfile : null);

user.onChange((u) => {
  if (u) {
    storage.setItem({ key: Key.PROFILE, value: JSON.stringify(u) });
  } else {
    storage.removeItem(Key.PROFILE);
  }
});
token.onChange((t) => (t ? null : user.set(null)));

export default user;
