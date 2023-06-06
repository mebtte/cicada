import getExploration from '@/server/api/get_exploration';

type Exploration = AsyncReturnType<typeof getExploration>;

export enum ExplorationItemType {
  MUSIC,
  SINGER,
  PUBLIC_MUSICBILL,
}

export type Music = Exploration['musicList'][0];
export type Singer = Exploration['singerList'][0];
export type PublicMusicbill = Exploration['publicMusicbillList'][0];

export interface ExplorationMusic {
  type: ExplorationItemType.MUSIC;
  value: Music;
}

export interface ExplorationSinger {
  type: ExplorationItemType.SINGER;
  value: Singer;
}

export interface ExplorationPublicMusicbill {
  type: ExplorationItemType.PUBLIC_MUSICBILL;
  value: PublicMusicbill;
}

export type ExplorationItem =
  | ExplorationMusic
  | ExplorationSinger
  | ExplorationPublicMusicbill;
