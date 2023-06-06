import getExploration from '@/server/api/get_exploration';

export type Exploration = AsyncReturnType<typeof getExploration>;
