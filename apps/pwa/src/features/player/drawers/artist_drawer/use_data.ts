import logger from '@/utils/logger';
import getArtist from '@/server/api/get_artist';
import { useCallback, useEffect, useState } from 'react';
import { Artist } from './constants';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../eventemitter';

type Data =
  | {
      error: null;
      loading: true;
      value: null;
    }
  | {
      error: Error;
      loading: false;
      value: null;
    }
  | {
      error: null;
      loading: false;
      value: Artist;
    };
const dataLoading: Data = {
  error: null,
  loading: true,
  value: null,
};

export default (artistId: string) => {
  const [data, setData] = useState<Data>(dataLoading);
  const getData = useCallback(async () => {
    setData(dataLoading);
    try {
      const artist = await getArtist(artistId);
      setData({
        error: null,
        loading: false,
        value: artist,
      });
    } catch (error) {
      logger.error(error, 'Fail to get artist');
      setData({
        error,
        loading: false,
        value: null,
      });
    }
  }, [artistId]);

  useEffect(() => {
    getData();
  }, [getData]);

  useEffect(() => {
    const unlistenArtistUpdated = playerEventemitter.listen(
      PlayerEventType.ARTIST_UPDATED,
      (payload) => {
        if (payload.id === artistId) {
          getData();
        }
      },
    );
    return unlistenArtistUpdated;
  }, [getData, artistId]);

  return { data, reload: getData };
};
