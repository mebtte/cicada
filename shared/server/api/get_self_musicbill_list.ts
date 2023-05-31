import { MusicbillSharedStatus } from '../../constants';

export type Response = {
  id: string;
  cover: string;
  name: string;
  public: 0 | 1;
  createTimestamp: number;
  shareStatus: MusicbillSharedStatus;
}[];
