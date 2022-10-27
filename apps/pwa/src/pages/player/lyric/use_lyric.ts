import { useEffect, useState } from 'react';
import { MusicType } from '#/constants/music';
import getLyric from '@/server/get_lyric';
import { Music } from '../constants';
import { Lyric, Status } from './constants';

interface TurntableState {
  status: Status.TURNTABLE;
}
interface LRCLoadingState {
  status: Status.LRC_LOADING;
}
interface LRCEmptyState {
  status: Status.LRC_EMPTY;
}

const TURNTABLE_STATE: TurntableState = {
  status: Status.TURNTABLE,
};
const LRC_LOADING_STATE: LRCLoadingState = {
  status: Status.LRC_LOADING,
};
const LRC_EMPTY_STATE: LRCEmptyState = {
  status: Status.LRC_EMPTY,
};

export default (music: Music, turntable: boolean) => {
  const [state, setState] = useState<
    | TurntableState
    | LRCLoadingState
    | {
        status: Status.LRC_ERROR;
        error: Error;
        retry: () => void;
      }
    | {
        status: Status.LRC_SUCCESS;
        lyrics: Lyric[];
      }
    | LRCEmptyState
  >({
    status: Status.TURNTABLE,
  });

  useEffect(() => {
    let canceled = false;
    const getMusicLrc = async () => {
      if (turntable || music.type === MusicType.INSTRUMENT) {
        return setState(TURNTABLE_STATE);
      }

      setState(LRC_LOADING_STATE);
      try {
        const lyrics = await getLyric({ musicId: music.id });

        if (canceled) {
          return;
        }

        if (lyrics.length) {
          setState({ status: Status.LRC_SUCCESS, lyrics });
        } else {
          setState(LRC_EMPTY_STATE);
        }
      } catch (error) {
        console.error(error);
        if (canceled) {
          return;
        }
        setState({ status: Status.LRC_ERROR, error, retry: getMusicLrc });
      }
    };

    getMusicLrc();
    return () => {
      canceled = true;
    };
  }, [turntable, music]);

  return state;
};
