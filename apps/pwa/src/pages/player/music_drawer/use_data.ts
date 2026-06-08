import { useCallback, useEffect, useState } from 'react';
import getMusicRequest from '@/server/api/get_music';
import { MusicType } from '@/constants/music';
import getLyricList from '@/server/api/get_lyric_list';
import day from '@/utils/day';
import sleep from '@/utils/sleep';
import { MusicDetail, Lyric } from './constants';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../eventemitter';

const MUSIC_DRAWER_LOAD_MINIMAL_DURATION = 1000;

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

async function loadMusicDetail(id: string): Promise<MusicDetail> {
  const music = await getMusicRequest({ id, requestMinimalDuration: 0 });
  let lyrics: Lyric[] = [];
  if (music.type === MusicType.SONG) {
    lyrics = await getLyricList({
      musicId: music.id,
      requestMinimalDuration: 0,
    });
  }

  return {
    ...music,
    lyrics,
    createTime: day(music.createTimestamp).format('YYYY-MM-DD'),
    heat: music.heat,
  };
}

export default (id: string) => {
  const [data, setData] = useState<Data>(dataLoading);

  const getMusic = useCallback(async () => {
    setData(dataLoading);
    try {
      // 详情和歌词是串行请求, 统一限制抽屉加载态最短 1s, 避免两个接口各自叠加等待。
      const [musicResult] = await Promise.allSettled([
        loadMusicDetail(id),
        sleep(MUSIC_DRAWER_LOAD_MINIMAL_DURATION),
      ]);
      if (musicResult.status === 'rejected') {
        throw musicResult.reason;
      }

      setData({
        error: null,
        loading: false,
        music: musicResult.value,
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
    const unlistenArtistUpdated = playerEventemitter.listen(
      PlayerEventType.ARTIST_UPDATED,
      (payload) => {
        const artists = [
          ...(data.music?.singers ?? []),
          ...(data.music?.lyricists ?? []),
        ];
        if (artists.find((artist) => artist.id === payload.id)) {
          getMusic();
        }
      },
    );
    return unlistenArtistUpdated;
  }, [data.music, getMusic]);

  return { data, reload: getMusic };
};
