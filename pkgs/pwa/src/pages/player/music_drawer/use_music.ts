import { useCallback, useEffect, useState } from 'react';

import getMusicDetail from '@/server/get_music_detail';
import { Data } from './constants';
import { transformMusic } from '../utils';

export default (id: string) => {
  const [data, setData] = useState<Data>({
    error: null,
    loading: true,
    music: null,
  });
  const getMusic = useCallback(async () => {
    setData({
      error: null,
      loading: true,
      music: null,
    });
    try {
      const music = await getMusicDetail(id);
      setData({
        error: null,
        loading: false,
        music: {
          // @ts-expect-error
          ...transformMusic(music),
          fork: music.fork.map(transformMusic),
          forkFrom: music.fork_from.map(transformMusic),
          lrc: music.lrc,
        },
      });
    } catch (error) {
      setData({
        error,
        loading: false,
        music: null,
      });
    }
  }, [id]);

  useEffect(() => {
    getMusic();
  }, [getMusic]);

  return { data, reload: getMusic };
};
