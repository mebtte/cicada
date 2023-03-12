import adminGetUserList from '@/server/api/admin_get_user_list';
import { useCallback, useEffect, useState } from 'react';
import getRandomCover from '@/utils/get_random_cover';
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
          avatar: user.avatar || getRandomCover(),
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

  return {
    data,
    reload: getData,
  };
};
