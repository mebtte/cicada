import getMusicbillSharedUserList from '@/server/api/get_musicbill_shared_user_list';

export type User = AsyncReturnType<typeof getMusicbillSharedUserList>[0];
