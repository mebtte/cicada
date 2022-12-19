import logger from '#/utils/logger';
import getExploration from '@/server/get_exploration';
import { useCallback, useEffect, useState } from 'react';
import { Exploration } from './constants';

type Data =
  | {
      error: Error;
      loading: false;
      data: null;
    }
  | {
      error: null;
      loading: true;
      data: null;
    }
  | {
      error: null;
      loading: false;
      data: Exploration;
    };
const dataLoading: Data = {
  error: null,
  loading: true,
  data: null,
};

export default () => {
  const [data, setData] = useState<Data>(dataLoading);
  const getData = useCallback(async () => {
    setData(dataLoading);
    try {
      const d = await getExploration();
      setData({
        error: null,
        loading: false,
        data: d,
      });
    } catch (error) {
      logger.error(error, '获取探索数据失败');
      setData({
        error,
        loading: false,
        data: null,
      });
    }
  }, []);

  useEffect(() => {
    getData();
  }, [getData]);

  return { data, reload: getData };
};
