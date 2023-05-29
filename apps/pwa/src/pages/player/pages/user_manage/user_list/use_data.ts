import adminGetUserList from '@/server/api/admin_get_user_list';
import { useCallback, useEffect, useState } from 'react';
import DefaultCover from '@/asset/default_cover.jpeg';
import { User } from '../constants';
import e, { EventType } from '../eventemitter';

interface Data {
  error: Error | null;
  loading: boolean;
  userList: User[];
}
const dataLoading: Data = {
  error: null,
  loading: true,
  userList: [],
};

export default () => {
  const [data, setData] = useState(dataLoading);
  const getData = useCallback(async () => {
    setData(dataLoading);
    try {
      const userList = await adminGetUserList();
      setData({
        error: null,
        loading: false,
        userList: userList.map((user) => ({
          ...user,
          avatar: user.avatar || DefaultCover,
        })),
      });
    } catch (error) {
      setData({
        error,
        loading: false,
        userList: [],
      });
    }
  }, []);

  useEffect(() => {
    getData();

    const unlistenReload = e.listen(EventType.RELOAD_DATA, getData);
    return unlistenReload;
  }, [getData]);

  useEffect(() => {
    const unlistenUserUpdated = e.listen(EventType.USER_UPDATED, (payload) =>
      setData((d) => ({
        ...d,
        userList: d.userList.map((u) =>
          u.id === payload.id
            ? {
                ...u,
                ...payload,
              }
            : u,
        ),
      })),
    );
    const unlistenUserDeleted = e.listen(EventType.USER_DELETED, (payload) =>
      setData((d) => ({
        ...d,
        userList: d.userList.filter((u) => u.id !== payload.id),
      })),
    );
    return () => {
      unlistenUserUpdated();
      unlistenUserDeleted();
    };
  }, []);

  return {
    data,
    reload: getData,
  };
};
