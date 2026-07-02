import logger from '@/utils/logger';
import getUser from '@/server/api/get_user';
import DefaultCover from '@/static/apple-touch-icon_v1.png';
import { useCallback, useEffect, useState } from 'react';
import { UserDetail } from './constants';

interface Data {
  error: Error | null;
  loading: boolean;
  userDetail: UserDetail | null;
}
const dataLoading: Data = {
  error: null,
  loading: true,
  userDetail: null,
};

export default (id: string) => {
  const [data, setData] = useState(dataLoading);
  const getData = useCallback(async () => {
    setData(dataLoading);
    try {
      const userDetail = await getUser(id);
      setData({
        error: null,
        loading: false,
        userDetail: {
          ...userDetail,
          avatar: userDetail.avatar || DefaultCover,
          musicbillList: userDetail.musicbillList.map((m) => ({
            ...m,
            cover: m.cover || DefaultCover,
          })),
        },
      });
    } catch (error) {
      logger.error(error, '获取用户详情失败');
      setData({
        error,
        loading: false,
        userDetail: null,
      });
    }
  }, [id]);

  useEffect(() => {
    getData();
  }, [getData]);

  return { data, reload: getData };
};
