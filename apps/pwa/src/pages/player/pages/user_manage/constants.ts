import adminGetUserList from '@/server/admin_get_user_list';

export type User = Required<AsyncReturnType<typeof adminGetUserList>[0]>;

export const TOOLBAR_HEIGHT = 50;
