import XState from '@/utils/x_state';
import storage, { Key } from '@/platform/storage';
import getProfile from '@/server_new/get_profile';
import notice from '@/platform/notice';
import token from './token';

export interface User {
  id: string;
  email: string;
  avatar: string;
  nickname: string;
  joinTimestamp: number;
  super: boolean;
}

let initialUser: User | null = null;
const userString = storage.getItem(Key.USER);
if (userString) {
  try {
    initialUser = JSON.parse(userString);
  } catch (error) {
    console.error(error);
  }
}

const user = new XState<User | null>(token.get() ? initialUser : null);

if (initialUser) {
  getProfile()
    .then((u) =>
      user.set({
        ...u,
        super: !!u.super,
      }),
    )
    .catch((e) => {
      console.error(e);
      return notice.error('更新用户信息失败');
    });
}

user.onChange((u) => {
  if (u) {
    storage.setItem({ key: Key.USER, value: JSON.stringify(u) });
  } else {
    storage.removeItem(Key.USER);
  }
});
token.onChange((t) => (t ? null : user.set(null)));

export default user;
