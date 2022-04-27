import { useEffect, useState } from 'react';

import logger from '@/platform/logger';
import getMusicLrcRequest from '@/server/get_music_lrc';
import { MusicType } from '@/constants/music';
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
        const lrc = await getMusicLrcRequest({ musicId: music.id, defer: 0 });

        if (canceled) {
          return;
        }

        if (lrc) {
          setState({ status: Status.LRC_SUCCESS, lrc });
        } else {
          setState(LRC_EMPTY_STATE);
        }
      } catch (error) {
        if (canceled) {
          return;
        }
        logger.error(error, { description: '获取音乐 LRC 失败', report: true });
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
