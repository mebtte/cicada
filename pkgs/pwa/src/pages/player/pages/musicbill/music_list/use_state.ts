import { RequestStatus } from '@/constants';
import { useMemo } from 'react';

import { MusicWithIndex, Musicbill } from '../../../constants';
import { Status } from './constants';
import filterMusicList from './filter_music_list';

interface LoadingState {
  status: Status.LOADING;
}
interface EmptyState {
  status: Status.EMPTY;
}

const LOADING_STATE: LoadingState = {
  status: Status.LOADING,
};
const EMPTY_STATE: EmptyState = {
  status: Status.EMPTY,
};

type State =
  | LoadingState
  | {
      status: Status.ERROR;
      error: Error;
    }
  | EmptyState
  | {
      status: Status.SUCCESS;
      musicList: MusicWithIndex[];
    };
const getState = (musicbill: Musicbill, keyword: string): State => {
  const { status, musicList, error } = musicbill;
  const filteredMusicList = filterMusicList(musicList, keyword);
  if (status === RequestStatus.SUCCESS) {
    if (filteredMusicList.length) {
      return { status: Status.SUCCESS, musicList: filteredMusicList };
    }
    return EMPTY_STATE;
  }
  if (status === RequestStatus.NOT_START || status === RequestStatus.LOADING) {
    return LOADING_STATE;
  }
  return { status: Status.ERROR, error: error! };
};

export default (musicbill: Musicbill, keyword: string) => {
  const state = useMemo<State>(
    () => getState(musicbill, keyword),
    [musicbill, keyword],
  );
  return state;
};
