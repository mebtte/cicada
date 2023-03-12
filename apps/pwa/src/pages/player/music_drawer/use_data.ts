import { useCallback, useEffect, useState } from 'react';
import getMusicDetail from '@/server/api/get_music_detail';
import { MusicType } from '#/constants/music';
import getLyricList from '@/server/api/get_lyric_list';
import getRandomCover from '@/utils/get_random_cover';
import day from '#/utils/day';
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
      const music = await getMusicDetail(id);
      let lyrics: Lyric[] = [];
      if (music.type === MusicType.SONG) {
        lyrics = await getLyricList({ musicId: music.id, minDuration: 0 });
      }

      setData({
        error: null,
        loading: false,
        music: {
          ...music,
          cover: music.cover || getRandomCover(),
          lyrics,
          createTime: day(music.createTimestamp).format('YYYY-MM-DD'),
          singers: music.singers.map((s) => ({
            ...s,
            avatar: s.avatar || getRandomCover(),
          })),
          forkFromList: music.forkFromList.map((m) => ({
            ...m,
            cover: m.cover || getRandomCover(),
          })),
          forkList: music.forkList.map((m) => ({
            ...m,
            cover: m.cover || getRandomCover(),
          })),
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
      ({ music }) => {
        if (music.id === id) {
          getMusic();
        }
      },
    );

    return unlistenMusicUpdated;
  }, [getMusic, id]);

  useEffect(() => {
    const unlistenSingerUpdated = playerEventemitter.listen(
      PlayerEventType.SINGER_UPDATED,
      ({ singer }) => {
        if (data.music && data.music.singers.find((s) => s.id === singer.id)) {
          getMusic();
        }
      },
    );
    return unlistenSingerUpdated;
  }, [data.music, getMusic]);

  return { data, reload: getMusic };
};
