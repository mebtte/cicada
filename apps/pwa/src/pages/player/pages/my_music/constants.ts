import { MusicWithSingerAliases } from '../../constants';

export const PAGE_SIZE = 50;

export const TOOLBAR_HEIGHT = 'calc(60px + env(safe-area-inset-bottom, 0))';

export interface Music extends MusicWithSingerAliases {
  heat: number;
  createTimestamp: number;
  index: number;
}
