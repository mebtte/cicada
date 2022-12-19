import getExploration from '@/server/get_exploration';

export type Exploration = AsyncReturnType<typeof getExploration>;

export interface CardItem {
  id: string;
  title: string;
  subTitle?: string;
  cover: string;
}
