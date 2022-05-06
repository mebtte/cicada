import Eventemitter from 'eventemitter3';
import { useEffect, useState } from 'react';

import { User } from '@/constants/user';
import { getToken } from './token';
import storage, { Key } from './storage';

enum EventType {
  USER_UPDATED = 'user_updated',
}
const eventemitter = new Eventemitter<EventType>();

const token = getToken();
let user: User | null = null;
const userString = storage.getItem(Key.USER);
if (token && userString) {
  try {
    user = JSON.parse(userString);
    user!.joinTime = new Date(user!.joinTime);
  } catch (error) {
    console.error(error);
  }
}

function getUser() {
  return user;
}

export default {
  getUser,
  updateUser: (u: User | null) => {
    user = u;
    eventemitter.emit(EventType.USER_UPDATED, { user: u });

    if (u) {
      storage.setItem({ key: Key.USER, value: JSON.stringify(u) });
    } else {
      storage.removeItem(Key.USER);
    }
  },
  useUser: () => {
    const [u, setU] = useState(getUser());

    useEffect(() => {
      const onUserUpdated = ({ user: newUser }: { user: User | null }) =>
        setU(newUser);
      eventemitter.on(EventType.USER_UPDATED, onUserUpdated);
      return () => void eventemitter.off(EventType.USER_UPDATED, onUserUpdated);
    }, []);

    return u;
  },
};
