import { useEffect, useState } from 'react';
import { MusicType } from '#/constants/music';
import { ExceptionCode } from '#/constants/exception';
import getLyric from '@/server/get_lyric';
import { Music } from '../constants';
import { Status } from './constants';

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
        lrc: string;
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
        const lyric = await getLyric(music.id);

        if (canceled) {
          return;
        }

        setState({ status: Status.LRC_SUCCESS, lrc: lyric });
      } catch (error) {
        console.error(error);
        if (canceled) {
          return;
        }
        if (error.code === ExceptionCode.LYRIC_NOT_EXIST) {
          setState(LRC_EMPTY_STATE);
        } else {
          setState({ status: Status.LRC_ERROR, error, retry: getMusicLrc });
        }
      }
    };

    getMusicLrc();
    return () => {
      canceled = true;
    };
  }, [turntable, music]);

  return state;
};
