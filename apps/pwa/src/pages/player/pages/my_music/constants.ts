import { MusicType } from '#/constants/music';

export const PAGE_SIZE = 50;

export const TOOLBAR_HEIGHT = 50;

export interface Music {
  id: string;
  type: MusicType;
  name: string;
  aliases: string[];
  heat: number;
  singers: {
    id: string;
    name: string;
  }[];
  createTimestamp: number;
  index: number;
}
