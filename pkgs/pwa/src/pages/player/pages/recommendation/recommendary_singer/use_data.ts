import { useCallback, useEffect, useState } from 'react';

import getRandomCover from '@/utils/get_random_cover';
import logger from '@/platform/logger';
import getRecommendatorySingerListRequest from '@/server/get_recommendatory_singer_list';
import { Figure } from '../../../constants';

export default () => {
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);
  const [singerList, setSingerList] = useState<Figure[]>([]);
  const getRecommendatorySingerList = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const sl = await getRecommendatorySingerListRequest();
      setSingerList(
        sl.map((s) => ({
          ...s,
          avatar: s.avatar || getRandomCover(),
        })),
      );
    } catch (e) {
      logger.error(e, { description: '获取推荐歌手列表失败', report: true });
      setError(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    getRecommendatorySingerList();
  }, [getRecommendatorySingerList]);

  return { error, loading, singerList, reload: getRecommendatorySingerList };
};
