import { useCallback, useEffect, useState } from 'react';
import getMusicDetail from '@/server/get_music_detail';
import { MusicType } from '#/constants/music';
import getLyric from '@/server/get_lyric';
import getRandomCover from '@/utils/get_random_cover';
import { MusicDetail, Lyric } from './constants';

interface Data {
  error: Error | null;
  loading: boolean;
  music: MusicDetail | null;
}
const dataLoading: Data = {
  error: null,
  loading: true,
  music: null,
};

export default (id: string) => {
  const [data, setData] = useState<Data>(dataLoading);

  const getMusic = useCallback(async () => {
    setData(dataLoading);
    try {
      const music = await getMusicDetail(id);
      let lyrics: Lyric[] = [];
      if (music.type === MusicType.SONG) {
        lyrics = await getLyric({ musicId: music.id, minDuration: 0 });
      }

      setData({
        error: null,
        loading: false,
        music: {
          ...music,
          cover: music.cover || getRandomCover(),
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
