import { useState, useCallback, useEffect, useRef } from 'react';

import getMusicLrc from '@/server/get_music_lrc';
import logger from '@/platform/logger';
import { RequestStatus } from '@/constants';

export default (id: string) => {
  const idRef = useRef(id);
  idRef.current = id;

  const [lrc, setLrc] = useState<
    | { status: RequestStatus.LOADING }
    | {
        status: RequestStatus.ERROR;
        error: Error;
      }
    | {
        status: RequestStatus.SUCCESS;
        value: string;
      }
  >({ status: RequestStatus.LOADING });
  const getLrc = useCallback(async () => {
    setLrc({ status: RequestStatus.LOADING });
    try {
      const l = await getMusicLrc({ musicId: id });

      if (idRef.current === id) {
        setLrc({ status: RequestStatus.SUCCESS, value: l });
      }
    } catch (error) {
      logger.error(error, { description: '获取音乐 lrc 失败', report: true });

      if (idRef.current === id) {
        setLrc({
          status: RequestStatus.ERROR,
          error,
        });
      }
    }
  }, [id]);

  useEffect(() => {
    getLrc();
  }, [getLrc]);

  return {
    lrc,
    retry: getLrc,
  };
};
