import { useCallback, useEffect, useState } from 'react';
import getMusicDetail from '@/server/get_music_detail';
import { MusicType } from '#/constants/music';
import getLyric from '@/server/get_lyric';
import { Data, Lyric } from './constants';
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
      let lyrics: Lyric[] | null = null;
      if (music.type === MusicType.SONG) {
        lyrics = await getLyric(music.id);
      }

      setData({
        error: null,
        loading: false,
        music: {
          ...transformMusic(music),
          fork: music.forkList.map(transformMusic),
          forkFrom: music.forkFromList.map(transformMusic),
          lyrics,
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
