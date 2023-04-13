import { MusicWithIndex } from '../../constants';

export const PAGE_SIZE = 50;

export const TOOLBAR_HEIGHT = 60;

export interface MusicPlayRecord extends MusicWithIndex {
  recordId: number;
  percent: number;
  timestamp: number;
}
