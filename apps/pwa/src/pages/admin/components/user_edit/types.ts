import adminGetUserList from '@/server/api/admin_get_user_list';

export type User = Awaited<ReturnType<typeof adminGetUserList>>[number];
