import { useCallback, useEffect, useState } from 'react';
import getMusicRequest from '@/server/api/get_music';
import { MusicType } from '@/constants/music';
import getLyricList from '@/server/api/get_lyric_list';
import day from '@/utils/day';
import { MusicDetail, Lyric } from './constants';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../eventemitter';

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
      const music = await getMusicRequest({ id, requestMinimalDuration: 0 });
      let lyrics: Lyric[] = [];
      if (music.type === MusicType.SONG) {
        lyrics = await getLyricList({
          musicId: music.id,
          requestMinimalDuration: 0,
        });
      }

      setData({
        error: null,
        loading: false,
        music: {
          ...music,
          lyrics,
          createTime: day(music.createTimestamp).format('YYYY-MM-DD'),
          heat: music.heat,
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

  useEffect(() => {
    const unlistenMusicUpdated = playerEventemitter.listen(
      PlayerEventType.MUSIC_UPDATED,
      (payload) => {
        if (payload.id === id) {
          getMusic();
        }
      },
    );

    return unlistenMusicUpdated;
  }, [getMusic, id]);

  useEffect(() => {
    const unlistenSingerUpdated = playerEventemitter.listen(
      PlayerEventType.SINGER_UPDATED,
      (payload) => {
        if (data.music?.singers.find((s) => s.id === payload.id)) {
          getMusic();
        }
      },
    );
    return unlistenSingerUpdated;
  }, [data.music, getMusic]);

  return { data, reload: getMusic };
};
