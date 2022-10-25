import getSingerDetail from '@/server/get_singer_detail';

export type Singer = AsyncReturnType<typeof getSingerDetail>;
