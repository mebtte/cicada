import { useEffect, useState, useCallback } from 'react';

import { RequestStatus } from '@/constants';
import { getPWAOrigin } from '@/platform/electron_new';
import logger from '@/platform/logger';

export default () => {
  const [status, setStatus] = useState(RequestStatus.LOADING);
  const [error, setError] = useState<Error | null>(
    new Error('TypeError: sdfhkas, dskhfk, sdjfhksdh,sdhfjk'),
  );
  const [pwaOrigin, setPwaOrigin] = useState('');
  const getData = useCallback(async () => {
    setStatus(RequestStatus.LOADING);
    try {
      const [po] = await Promise.all([getPWAOrigin()]);
      setPwaOrigin(po);
      setStatus(RequestStatus.SUCCESS);
    } catch (e) {
      logger.error(e, {
        description: '获取 electron 初始设置信息失败',
        report: true,
      });
      setError(e);
      setStatus(RequestStatus.ERROR);
    }
  }, []);

  useEffect(() => {
    getData();
  }, [getData]);

  return { status, error, retry: getData, pwaOrigin };
};
