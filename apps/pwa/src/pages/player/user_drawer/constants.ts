import { t } from '@/i18n';
import getUser from '@/server/api/get_user';

export type UserDetail = AsyncReturnType<typeof getUser>;

export enum Tab {
  MUSIC = 'music',
  MUSICBILL = 'musicbill',
}

export const TAB_MAP_LABEL: Record<Tab, string> = {
  [Tab.MUSIC]: t('music_created'),
  [Tab.MUSICBILL]: t('musicbill'),
};

export const MINI_INFO_HEIGHT = 50;
