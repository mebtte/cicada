import getExploration from '@/server/api/get_exploration';

type Exploration = AsyncReturnType<typeof getExploration>;

export type Music = Exploration['musicList'][0];
export type Singer = Exploration['singerList'][0];
export type PublicMusicbill = Exploration['publicMusicbillList'][0];
export type ExplorationData = Exploration;
