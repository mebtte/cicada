import getExploration from '@/server/api/get_exploration';
import { ReactNode } from 'react';

export type Exploration = AsyncReturnType<typeof getExploration>;

export interface CardItem {
  id: string;
  title: string;
  subTitleRenderer?: () => ReactNode;
  cover: string;
}
