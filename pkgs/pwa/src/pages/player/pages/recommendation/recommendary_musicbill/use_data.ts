import { useCallback, useEffect, useState } from 'react';

import getRandomCover from '@/utils/get_random_cover';
import logger from '@/platform/logger';
import getRecommendatoryMusicbillListRequest from '@/server/get_recommendatory_musicbill_list';
import { Musicbill } from './constants';

export default () => {
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);
  const [musicbillList, setMusicbillList] = useState<Musicbill[]>([]);
  const getRecommendatoryMusicbillList = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const ml = await getRecommendatoryMusicbillListRequest();
      setMusicbillList(
        ml.map((m) => ({
          ...m,
          cover: m.cover || getRandomCover(),
        })),
      );
    } catch (e) {
      logger.error(e, { description: '获取推荐歌单列表失败', report: true });
      setError(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    getRecommendatoryMusicbillList();
  }, [getRecommendatoryMusicbillList]);

  return {
    error,
    loading,
    musicbillList,
    reload: getRecommendatoryMusicbillList,
  };
};
