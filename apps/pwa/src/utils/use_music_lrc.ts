import { useState, useCallback, useEffect, useRef } from 'react';
import getMusicLrc from '@/server_new/get_music_lrc';
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
      const musicLrc = await getMusicLrc(id);

      if (idRef.current === id) {
        setLrc({ status: RequestStatus.SUCCESS, value: musicLrc.lrc });
      }
    } catch (error) {
      console.error(error);
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
