import { MusicType } from '#/constants/music';
import logger from '#/utils/logger';
import getLyricList from '@/server/api/get_lyric_list';
import { useCallback, useEffect, useState } from 'react';
import { QueueMusic } from '../../constants';
import { LyricData, Status } from './constants';

export default (queueMusic: QueueMusic) => {
  const [data, setData] = useState<LyricData>({ status: Status.LOADING });
  const getData = useCallback(async () => {
    if (queueMusic.type === MusicType.INSTRUMENT) {
      return setData({ status: Status.INSTRUMENT });
    }
    setData({ status: Status.LOADING });
    try {
      const lyricList = await getLyricList({ musicId: queueMusic.id });
      if (lyricList.length) {
        setData({ status: Status.SUCCESS, lrcs: lyricList.map((l) => l.lrc) });
      } else {
        setData({ status: Status.EMPTY });
      }
    } catch (error) {
      logger.error(error, '加载歌词失败');
      setData({ status: Status.ERROR, error });
    }
  }, [queueMusic.id, queueMusic.type]);

  useEffect(() => {
    getData();
  }, [getData]);

  return { data, retry: getData };
};
