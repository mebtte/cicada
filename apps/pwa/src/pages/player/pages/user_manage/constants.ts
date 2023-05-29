import adminGetUserList from '@/server/api/admin_get_user_list';

export type User = AsyncReturnType<typeof adminGetUserList>[0];

export const TOOLBAR_HEIGHT = 60;
