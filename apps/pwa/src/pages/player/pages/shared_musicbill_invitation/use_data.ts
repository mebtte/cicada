import { useCallback, useEffect, useState } from 'react';
import logger from '@/utils/logger';
import getSharedMusicbillInvitationList from '@/server/api/get_shared_musicbill_invitation_list';
import { Invitation } from './constants';

type Data =
  | {
      loading: true;
      error: null;
      value: Invitation[];
    }
  | {
      loading: false;
      error: Error;
      value: Invitation[];
    }
  | {
      loading: false;
      error: null;
      value: Invitation[];
    };
const dataLoading: Data = {
  loading: true,
  error: null,
  value: [],
};

export default () => {
  const [data, setData] = useState<Data>(dataLoading);
  const getData = useCallback(async () => {
    setData(dataLoading);
    try {
      const d = await getSharedMusicbillInvitationList();
      setData({
        loading: false,
        error: null,
        value: d,
      });
    } catch (error) {
      logger.error(error, '获取共享乐单邀请列表失败');
      setData({
        loading: false,
        error,
        value: [],
      });
    }
  }, []);

  useEffect(() => {
    getData();
  }, [getData]);

  return { data, reload: getData };
};
