import { Music as BaseMusic } from '../../constants';

export const PAGE_SIZE = 50;

export const TOOLBAR_HEIGHT = 50;

export interface Music extends BaseMusic {
  heat: number;
  createTimestamp: number;
  index: number;
}
