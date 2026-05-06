import { matchPath, useLocation } from 'react-router-dom';
import { useCallback, useEffect, useRef, useState } from 'react';
import { PLAYER_PATH, ROOT_PATH } from '@/constants/route';
import { t } from '@/i18n';
import getSinger from '@/server/api/get_singer';
import logger from '@/utils/logger';
import playerEventemitter, { EventType } from '../eventemitter';

export interface HeaderTitle {
  title: string;
  description?: string;
}

interface SingerHeaderTitle extends HeaderTitle {
  id: string;
}

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
  const [singerTitle, setSingerTitle] = useState<SingerHeaderTitle | null>(
    null,
  );
  const loadSingerTitle = useCallback(async (id: string) => {
    try {
      setSingerTitle(await getSingerHeaderTitle(id));
    } catch (error) {
      logger.error(error as Error, 'Fail to get singer title');
      setSingerTitle(null);
    }
  }, []);

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
      title = { title: t('music') };
      lastTitleRef.current = title;
      return title;
    }
    if (musicbillMatch) {
      title = { title: t('musicbill') };
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
      title = { title: t('exploration') };
      break;
    }
    case ROOT_PATH.PLAYER + PLAYER_PATH.SEARCH: {
      title = { title: t('search') };
      break;
    }
    case ROOT_PATH.PLAYER + PLAYER_PATH.USER_MANAGE: {
      title = { title: t('user_management') };
      break;
    }
    case ROOT_PATH.PLAYER + PLAYER_PATH.USER: {
      title = { title: t('profile') };
      break;
    }
    case ROOT_PATH.PLAYER + PLAYER_PATH.SETTING: {
      title = { title: t('setting') };
      break;
    }
    case ROOT_PATH.PLAYER + PLAYER_PATH.SHARED_MUSICBILL_INVITATION: {
      title = { title: t('shared_musicbill_invitation') };
      break;
    }
    case ROOT_PATH.PLAYER + PLAYER_PATH.PUBLIC_MUSICBILL_COLLECTION: {
      title = { title: t('public_musicbill_collection') };
      break;
    }
    case ROOT_PATH.PLAYER + PLAYER_PATH.MUSIC_PLAY_RECORD: {
      title = { title: t('music_play_record_short') };
      break;
    }
    case ROOT_PATH.PLAYER + PLAYER_PATH.DOWNLOADING_MUSIC: {
      title = { title: t('download') };
      break;
    }
    default: {
      title = { title: t('cicada') };
    }
  }

  lastTitleRef.current = title;
  return title;
};
