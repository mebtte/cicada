import { createContext } from 'react';

import { RequestStatus } from '@/constants';
import { PlayMode, MusicWithIndex, QueueMusic, Musicbill } from './constants';

interface Context {
  getMusicbillListStatus: RequestStatus;
  musicbillList: Musicbill[];

  playMode: PlayMode;

  audioLoading: boolean;
  audioPaused: boolean;
  audioDuration: number;

  playlist: MusicWithIndex[];

  playqueue: QueueMusic[];
  currentPlayqueuePosition: number;

  volume: number; // 音量
}

const context = createContext<Context>({
  getMusicbillListStatus: RequestStatus.LOADING,
  musicbillList: [],

  playMode: PlayMode.SQ,

  audioLoading: false,
  audioPaused: true,
  audioDuration: 0,

  playlist: [],

  playqueue: [],
  currentPlayqueuePosition: -1,

  volume: 1,
});

export default context;
