import { useCallback, useEffect, useState } from 'react';
import getMusicRequest from '@/server/api/get_music';
import { MusicType } from '@/constants/music';
import getLyricList from '@/server/api/get_lyric_list';
import day from '@/utils/day';
import { MusicDetail, Lyric } from './constants';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../eventemitter';

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
  const music = await getMusicRequest({ id });
  let lyrics: Lyric[] = [];
  if (music.type === MusicType.SONG) {
    lyrics = await getLyricList({ musicId: music.id });
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
      const music = await loadMusicDetail(id);
      setData({
        error: null,
        loading: false,
        music,
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
    const unlistenArtistUpdated = playerEventemitter.listen(
      PlayerEventType.ARTIST_UPDATED,
      (payload) => {
        const artists = [
          ...(data.music?.performers ?? []),
          ...(data.music?.lyricists ?? []),
          ...(data.music?.composers ?? []),
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
