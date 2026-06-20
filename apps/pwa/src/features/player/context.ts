import { createContext } from 'react';
import { RequestStatus } from '@/constants';
import {
  MusicWithArtistAliases,
  QueueMusic,
  Musicbill,
} from './constants';

interface Context {
  playEnabled: boolean;
  playNextEnabled: boolean;
  addToPlaylistEnabled: boolean;
  downloadEnabled: boolean;

  getMusicbillListStatus: RequestStatus;
  musicbillList: Musicbill[];

  audioLoading: boolean;
  audioPaused: boolean;
  audioDuration: number;
  audioBufferedPercent: number;

  playlist: (MusicWithArtistAliases & { index: number })[];

  playqueue: QueueMusic[];
  currentPlayqueuePosition: number;

  lyricPanelOpen: boolean;
}

const context = createContext<Context>({
  playEnabled: true,
  playNextEnabled: true,
  addToPlaylistEnabled: true,
  downloadEnabled: true,

  getMusicbillListStatus: RequestStatus.LOADING,
  musicbillList: [],

  audioLoading: false,
  audioPaused: true,
  audioDuration: 0,
  audioBufferedPercent: 0,

  playlist: [],

  playqueue: [],
  currentPlayqueuePosition: -1,

  lyricPanelOpen: false,
});

export default context;
