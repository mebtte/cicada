import { useCallback, useEffect, useState } from 'react';

import getRandomCover from '@/utils/get_random_cover';
import day from '@/utils/day';
import getUserDetailRequest from '@/server/get_user_detail';
import { Data } from './constants';

export default ({ id }: { id: string }) => {
  const [data, setData] = useState<Data>({
    loading: true,
    error: null,
    user: null,
  });
  const getUserDetail = useCallback(async () => {
    setData({
      loading: true,
      error: null,
      user: null,
    });
    try {
      const user = await getUserDetailRequest(id);
      setData({
        loading: false,
        error: null,
        user: {
          id: user.id,
          nickname: user.nickname,
          avatar: user.avatar || getRandomCover(),
          condition: user.condition,
          joinTimeString: day(new Date(user.join_time)).format('YYYY-MM-DD'),
          musicbillList: user.musicbill_list.map((mb) => ({
            ...mb,
            cover: mb.cover || getRandomCover(),
          })),
        },
      });
    } catch (error) {
      setData({
        loading: false,
        error,
        user: null,
      });
    }
  }, [id]);

  useEffect(() => {
    getUserDetail();
  }, [getUserDetail]);

  return { data, reload: getUserDetail };
};
