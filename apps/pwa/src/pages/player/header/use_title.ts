import { matchPath, useLocation } from 'react-router-dom';
import { useCallback, useEffect, useRef, useState } from 'react';
import { PLAYER_PATH, ROOT_PATH } from '@/constants/route';
import { t, type Key } from '@/i18n';
import getArtist from '@/server/api/get_artist';
import getMusic from '@/server/api/get_music';
import logger from '@/utils/logger';
import capitalize from '@/utils/capitalize';
import playerEventemitter, { EventType } from '../eventemitter';

export interface HeaderTitle {
  title: string;
  description?: string;
}

interface ArtistHeaderTitle extends HeaderTitle {
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

const getArtistHeaderTitle = async (
  id: string,
): Promise<ArtistHeaderTitle> => {
  const artist = await getArtist(id);
  return {
    id,
    title: artist.name,
    description: artist.aliases.length
      ? artist.aliases.join(' / ')
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
  const artistMatch = matchPath(
    `${ROOT_PATH.PLAYER}${PLAYER_PATH.ARTIST}`,
    pathname,
  );
  const artistId = artistMatch?.params.id;
  const musicId = musicMatch?.params.id;
  const [musicTitle, setMusicTitle] = useState<MusicHeaderTitle | null>(null);
  const [artistTitle, setArtistTitle] = useState<ArtistHeaderTitle | null>(
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
  const loadArtistTitle = useCallback(async (id: string) => {
    try {
      setArtistTitle(await getArtistHeaderTitle(id));
    } catch (error) {
      logger.error(error as Error, 'Fail to get artist title');
      setArtistTitle(null);
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
    if (!artistId) {
      setArtistTitle(null);
      return;
    }

    let canceled = false;
    setArtistTitle((current) => (current?.id === artistId ? current : null));
    getArtistHeaderTitle(artistId)
      .then((nextArtistTitle) => {
        if (canceled) {
          return;
        }
        setArtistTitle(nextArtistTitle);
      })
      .catch((error) => {
        if (canceled) {
          return;
        }
        logger.error(error as Error, 'Fail to get artist title');
        setArtistTitle(null);
      });

    return () => {
      canceled = true;
    };
  }, [artistId]);

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
    if (!artistId) {
      return;
    }

    return playerEventemitter.listen(EventType.ARTIST_UPDATED, (payload) => {
      if (payload.id === artistId) {
        loadArtistTitle(artistId);
      }
    });
  }, [loadArtistTitle, artistId]);

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
    if (!artistId) {
      return;
    }

    return playerEventemitter.listen(
      EventType.ARTIST_DETAIL_LOADED,
      (payload) => {
        if (payload.id === artistId) {
          setArtistTitle({
            id: payload.id,
            title: payload.name,
            description: payload.aliases.length
              ? payload.aliases.join(' / ')
              : undefined,
          });
        }
      },
    );
  }, [artistId]);

  let title: HeaderTitle;
  if (musicMatch || musicbillMatch || artistId) {
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
    if (artistTitle && artistTitle.id === artistId) {
      title = {
        title: artistTitle.title,
        description: artistTitle.description,
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
    case ROOT_PATH.PLAYER + PLAYER_PATH.OFFLINE_CACHE: {
      title = getStaticHeaderTitle('offline_cache');
      break;
    }
    default: {
      title = getStaticHeaderTitle('cicada');
    }
  }

  lastTitleRef.current = title;
  return title;
};
