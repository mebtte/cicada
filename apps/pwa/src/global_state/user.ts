import XState from '@/utils/x_state';
import storage, { Key } from '@/platform/storage';
import token from './token';

export interface User {
  id: string;
  email: string;
  avatar: string;
  nickname: string;
  joinTimestamp: Date;
  super: boolean;
}

let initialUser: User | null = null;
const userString = storage.getItem(Key.USER);
if (token.get() && userString) {
  // @todo(mebtte<hi@mebtte.com>)[发送请求更新用户信息]
  try {
    initialUser = JSON.parse(userString);
  } catch (error) {
    console.error(error);
  }
}

const user = new XState<User | null>(initialUser);

user.onChange((u) => {
  if (u) {
    storage.setItem({ key: Key.USER, value: JSON.stringify(u) });
  } else {
    storage.removeItem(Key.USER);
  }
});
token.onChange((t) => (t ? null : user.set(null)));

export default user;
