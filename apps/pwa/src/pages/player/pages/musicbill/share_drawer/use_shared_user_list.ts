import { useCallback, useEffect, useState } from 'react';
import getMusicbillSharedUserListRequest from '@/server/api/get_musicbill_shared_user_list';
import logger from '@/utils/logger';
import { User } from './constants';

type Data =
  | {
      loading: true;
      error: null;
      value: User[];
    }
  | {
      loading: false;
      error: Error;
      value: User[];
    }
  | {
      loading: false;
      error: null;
      value: User[];
    };
const dataLoading: Data = {
  loading: true,
  error: null,
  value: [],
};

export default ({ open, id }: { open: boolean; id: string }) => {
  const [data, setData] = useState<Data>(dataLoading);
  const getMusicbillSharedUserList = useCallback(async () => {
    setData(dataLoading);
    try {
      const userList = await getMusicbillSharedUserListRequest(id);
      setData({
        loading: false,
        error: null,
        value: userList,
      });
    } catch (error) {
      logger.error(error, '获取乐单共享用户列表失败');
      setData({
        loading: false,
        error,
        value: [],
      });
    }
  }, [id]);

  useEffect(() => {
    if (open) {
      getMusicbillSharedUserList();
    } else {
      setData(dataLoading);
    }
  }, [getMusicbillSharedUserList, open]);

  return { data, reload: getMusicbillSharedUserList };
};
