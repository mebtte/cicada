import adminGetUserList from '@/server/api/admin_get_user_list';

export type User = Required<AsyncReturnType<typeof adminGetUserList>[0]> & {
  avatar: string;
};

export const TOOLBAR_HEIGHT = 60;
