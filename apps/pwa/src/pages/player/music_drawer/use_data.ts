import { useCallback, useEffect, useState } from 'react';
import getMusicDetail from '@/server/api/get_music_detail';
import { MusicType } from '#/constants/music';
import getLyricList from '@/server/api/get_lyric_list';
import DefaultCover from '@/asset/default_cover.jpeg';
import day from '#/utils/day';
import { CacheName } from '@/constants/cache';
import logger from '@/utils/logger';
import timeout from '#/utils/timeout';
import { MusicDetail, Lyric } from './constants';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../eventemitter';

function getAudioDuration(url: string) {
  return Promise.race([
    new Promise<number>((resolve, reject) => {
      const audio = document.createElement('audio');
      audio.preload = 'metadata';
      audio.src = url;
      audio.addEventListener('loadedmetadata', () => resolve(audio.duration));
      audio.addEventListener('error', () =>
        reject(new Error(`Can not load audio from ${url}`)),
      );
    }),
    timeout(5000),
  ]);
}

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
        lyrics = await getLyricList({
          musicId: music.id,
          minRequestDuration: 0,
        });
      }

      /**
       * 获取音乐文件大小和时长
       * 如果有缓存从缓存读取
       * 没有缓存从网络加载
       * @author mebtte<hi@mebtte.com>
       */
      let size = 0;
      let duration = 0;
      try {
        if (window.caches) {
          const cache = await window.caches.open(CacheName.ASSET_MEDIA);
          const musicAsset = await cache.match(music.asset);
          if (musicAsset) {
            const blob = await musicAsset.blob();
            const url = URL.createObjectURL(blob);
            duration = await getAudioDuration(url).finally(() =>
              URL.revokeObjectURL(url),
            );
            size = blob.size;
          }
        }
      } catch (error) {
        logger.error(error, '解析本地音乐资源缓存失败');
      }
      if (!size || !duration) {
        try {
          const [assetHeadResponse, d] = await Promise.all([
            window.fetch(music.asset, {
              method: 'head',
            }),
            getAudioDuration(music.asset),
          ]);
          size = Number(assetHeadResponse.headers.get('content-length')) || 0;
          duration = d;
        } catch (error) {
          logger.error(error, '从网络加载音乐资源失败');
        }
      }

      setData({
        error: null,
        loading: false,
        music: {
          ...music,
          cover: music.cover || DefaultCover,
          lyrics,
          createTime: day(music.createTimestamp).format('YYYY-MM-DD'),
          singers: music.singers.map((s) => ({
            ...s,
            avatar: s.avatar || DefaultCover,
          })),
          forkFromList: music.forkFromList.map((m) => ({
            ...m,
            cover: m.cover || DefaultCover,
          })),
          forkList: music.forkList.map((m) => ({
            ...m,
            cover: m.cover || DefaultCover,
          })),
          heat: music.heat,

          size,
          duration,
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
