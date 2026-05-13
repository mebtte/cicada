import { matchPath, useLocation } from 'react-router-dom';
import { useCallback, useEffect, useRef, useState } from 'react';
import { PLAYER_PATH, ROOT_PATH } from '@/constants/route';
import { t, type Key } from '@/i18n';
import getSinger from '@/server/api/get_singer';
import getMusic from '@/server/api/get_music';
import logger from '@/utils/logger';
import capitalize from '@/utils/capitalize';
import playerEventemitter, { EventType } from '../eventemitter';

export interface HeaderTitle {
  title: string;
  description?: string;
}

interface SingerHeaderTitle extends HeaderTitle {
  id: string;
}
interface MusicHeaderTitle extends HeaderTitle {
  id: string;
}

const getMusicDescription = ({
  aliases,
}: {
  aliases: string[];
}) =>
  aliases.length ? aliases.join(' / ') : undefined;

const getStaticHeaderTitle = (key: Key): HeaderTitle => ({
  title: capitalize(t(key)),
});

const getMusicHeaderTitle = async (id: string): Promise<MusicHeaderTitle> => {
  const music = await getMusic({ id });
  return {
    id,
    title: music.name,
    description: getMusicDescription({
      aliases: music.aliases,
    }),
  };
};

const getSingerHeaderTitle = async (
  id: string,
): Promise<SingerHeaderTitle> => {
  const singer = await getSinger(id);
  return {
    id,
    title: singer.name,
    description: singer.aliases.length
      ? singer.aliases.join(' / ')
      : undefined,
  };
};

export default () => {
  const { pathname } = useLocation();
  const lastTitleRef = useRef<HeaderTitle>({ title: '' });
  const musicbillMatch = matchPath(
    `${ROOT_PATH.PLAYER}${PLAYER_PATH.MUSICBILL}`,
    pathname,
  );
  const musicMatch = matchPath(
    `${ROOT_PATH.PLAYER}${PLAYER_PATH.MUSIC}`,
    pathname,
  );
  const singerMatch = matchPath(
    `${ROOT_PATH.PLAYER}${PLAYER_PATH.SINGER}`,
    pathname,
  );
  const singerId = singerMatch?.params.id;
  const musicId = musicMatch?.params.id;
  const [musicTitle, setMusicTitle] = useState<MusicHeaderTitle | null>(null);
  const [singerTitle, setSingerTitle] = useState<SingerHeaderTitle | null>(
    null,
  );
  const loadMusicTitle = useCallback(async (id: string) => {
    try {
      setMusicTitle(await getMusicHeaderTitle(id));
    } catch (error) {
      logger.error(error as Error, 'Fail to get music title');
      setMusicTitle(null);
    }
  }, []);
  const loadSingerTitle = useCallback(async (id: string) => {
    try {
      setSingerTitle(await getSingerHeaderTitle(id));
    } catch (error) {
      logger.error(error as Error, 'Fail to get singer title');
      setSingerTitle(null);
    }
  }, []);

  useEffect(() => {
    if (!musicId) {
      setMusicTitle(null);
      return;
    }

    let canceled = false;
    setMusicTitle((current) => (current?.id === musicId ? current : null));
    getMusicHeaderTitle(musicId)
      .then((nextMusicTitle) => {
        if (canceled) {
          return;
        }
        setMusicTitle(nextMusicTitle);
      })
      .catch((error) => {
        if (canceled) {
          return;
        }
        logger.error(error as Error, 'Fail to get music title');
        setMusicTitle(null);
      });

    return () => {
      canceled = true;
    };
  }, [musicId]);

  useEffect(() => {
    if (!singerId) {
      setSingerTitle(null);
      return;
    }

    let canceled = false;
    setSingerTitle((current) => (current?.id === singerId ? current : null));
    getSingerHeaderTitle(singerId)
      .then((nextSingerTitle) => {
        if (canceled) {
          return;
        }
        setSingerTitle(nextSingerTitle);
      })
      .catch((error) => {
        if (canceled) {
          return;
        }
        logger.error(error as Error, 'Fail to get singer title');
        setSingerTitle(null);
      });

    return () => {
      canceled = true;
    };
  }, [singerId]);

  useEffect(() => {
    if (!musicId) {
      return;
    }

    return playerEventemitter.listen(EventType.MUSIC_UPDATED, (payload) => {
      if (payload.id === musicId) {
        loadMusicTitle(musicId);
      }
    });
  }, [loadMusicTitle, musicId]);

  useEffect(() => {
    if (!singerId) {
      return;
    }

    return playerEventemitter.listen(EventType.SINGER_UPDATED, (payload) => {
      if (payload.id === singerId) {
        loadSingerTitle(singerId);
      }
    });
  }, [loadSingerTitle, singerId]);

  useEffect(() => {
    if (!musicId) {
      return;
    }

    return playerEventemitter.listen(
      EventType.MUSIC_DETAIL_LOADED,
      (payload) => {
        if (payload.id === musicId) {
          setMusicTitle({
            id: payload.id,
            title: payload.name,
            description: getMusicDescription({
              aliases: payload.aliases,
            }),
          });
        }
      },
    );
  }, [musicId]);

  useEffect(() => {
    if (!singerId) {
      return;
    }

    return playerEventemitter.listen(
      EventType.SINGER_DETAIL_LOADED,
      (payload) => {
        if (payload.id === singerId) {
          setSingerTitle({
            id: payload.id,
            title: payload.name,
            description: payload.aliases.length
              ? payload.aliases.join(' / ')
              : undefined,
          });
        }
      },
    );
  }, [singerId]);

  let title: HeaderTitle;
  if (musicMatch || musicbillMatch || singerId) {
    if (musicMatch) {
      if (musicTitle && musicTitle.id === musicId) {
        title = {
          title: musicTitle.title,
          description: musicTitle.description,
        };
        lastTitleRef.current = title;
        return title;
      }
      return lastTitleRef.current.title
        ? lastTitleRef.current
        : getStaticHeaderTitle('music');
    }
    if (musicbillMatch) {
      title = getStaticHeaderTitle('musicbill');
      lastTitleRef.current = title;
      return title;
    }
    if (singerTitle && singerTitle.id === singerId) {
      title = {
        title: singerTitle.title,
        description: singerTitle.description,
      };
      lastTitleRef.current = title;
      return title;
    }
    return lastTitleRef.current;
  }
  switch (pathname) {
    case ROOT_PATH.PLAYER:
    case ROOT_PATH.PLAYER + PLAYER_PATH.EXPLORATION: {
      title = getStaticHeaderTitle('exploration');
      break;
    }
    case ROOT_PATH.PLAYER + PLAYER_PATH.SEARCH: {
      title = getStaticHeaderTitle('search');
      break;
    }
    case ROOT_PATH.PLAYER + PLAYER_PATH.USER_MANAGE: {
      title = getStaticHeaderTitle('user_management');
      break;
    }
    case ROOT_PATH.PLAYER + PLAYER_PATH.USER: {
      title = getStaticHeaderTitle('profile');
      break;
    }
    case ROOT_PATH.PLAYER + PLAYER_PATH.SETTING: {
      title = getStaticHeaderTitle('setting');
      break;
    }
    case ROOT_PATH.PLAYER + PLAYER_PATH.SHARED_MUSICBILL_INVITATION: {
      title = getStaticHeaderTitle('shared_musicbill_invitation');
      break;
    }
    case ROOT_PATH.PLAYER + PLAYER_PATH.PUBLIC_MUSICBILL_COLLECTION: {
      title = getStaticHeaderTitle('public_musicbill_collection');
      break;
    }
    case ROOT_PATH.PLAYER + PLAYER_PATH.MUSIC_PLAY_RECORD: {
      title = getStaticHeaderTitle('music_play_record_short');
      break;
    }
    case ROOT_PATH.PLAYER + PLAYER_PATH.EXPORTING_MUSIC: {
      title = getStaticHeaderTitle('export_music');
      break;
    }
    default: {
      title = getStaticHeaderTitle('cicada');
    }
  }

  lastTitleRef.current = title;
  return title;
};
