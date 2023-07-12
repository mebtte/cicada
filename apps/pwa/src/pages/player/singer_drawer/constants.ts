import getSinger from '@/server/api/get_singer';

export type Singer = AsyncReturnType<typeof getSinger>;
export type CreateUser = Singer['createUser'];
