import { MusicbillShareStatus } from '#/constants';

export interface LocalMusicbill {
  id: string;
  name: string;
  cover: string;
  public: boolean;
  shareStatus: MusicbillShareStatus;
}
