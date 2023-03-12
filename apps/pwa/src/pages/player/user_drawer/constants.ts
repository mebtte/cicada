import getUserDetail from '@/server/api/get_user_detail';
import { MusicWithIndex } from '../constants';

export type UserDetail = AsyncReturnType<typeof getUserDetail> & {
  musicList: MusicWithIndex[];
};

export enum Tab {
  MUSICBILL = 'musicbill',
  MUSIC = 'music',
}

export const TAB_MAP_LABEL: Record<Tab, string> = {
  [Tab.MUSIC]: '创建的音乐',
  [Tab.MUSICBILL]: '乐单',
};

export const MINI_INFO_HEIGHT = 50;
