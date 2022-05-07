import { MusicWithIndex } from '../constants';

export interface Singer {
  id: string;
  avatar: string;
  name: string;
  alias: string;
  musicList: MusicWithIndex[];
}

export type Data =
  | {
      error: Error;
      loading: false;
      singer: null;
    }
  | {
      error: null;
      loading: true;
      singer: null;
    }
  | {
      error: null;
      loading: false;
      singer: Singer;
    };
