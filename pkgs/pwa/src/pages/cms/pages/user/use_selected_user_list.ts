import { useEffect, useState } from 'react';

import eventemitter, { EventType } from './eventemitter';
import { User } from './constants';

export default () => {
  const [userList, setUserList] = useState<User[]>([]);

  useEffect(() => {
    /**
     * 用户更新后取消选中
     * 避免选中用户副本数据不一致
     */
    const userUpdated = ({ id }: { id: string }) =>
      setUserList((ul) => ul.filter((u) => u.id === id));
    const toggleSelect = ({ user }: { user: User }) =>
      setUserList((ul) => {
        const existUser = ul.find((u) => u.id === user.id);
        if (existUser) {
          return ul.filter((u) => u.id !== user.id);
        }
        return [...ul, user];
      });
    const unselect = ({ user }: { user: User }) =>
      setUserList((ul) => ul.filter((u) => u.id !== user.id));
    eventemitter.on(EventType.USER_UPDATED, userUpdated);
    eventemitter.on(EventType.TOGGLE_SELECT_USER, toggleSelect);
    eventemitter.on(EventType.UNSELECT_USER, unselect);
    return () => {
      eventemitter.off(EventType.USER_UPDATED, userUpdated);
      eventemitter.off(EventType.TOGGLE_SELECT_USER, toggleSelect);
      eventemitter.off(EventType.UNSELECT_USER, unselect);
    };
  }, []);

  return userList;
};
