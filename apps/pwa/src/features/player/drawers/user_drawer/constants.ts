import getUser from '@/server/api/get_user';

export type UserDetail = AsyncReturnType<typeof getUser>;

export const MINI_INFO_HEIGHT = 50;
