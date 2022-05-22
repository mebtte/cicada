/* eslint-disable no-nested-ternary */
import { PLAYER_PATH } from '@/constants/route';
import { Name } from '@/components/icon';

export enum NavigatorKey {
  HOME,
  SETTING,
  ABOUT,
  DESKTOP_APP,
}

export enum NavigatorType {
  LINK = 'link',
  ACTION = 'action',
}

export interface LinkNavigator {
  key: NavigatorKey;
  type: NavigatorType.LINK;
  label: string;
  icon: Name;
  link: string;
}

export interface ActionNavigator {
  key: NavigatorKey;
  type: NavigatorType.ACTION;
  label: string;
  icon: Name;
  action: () => void;
}

export type Navigator = LinkNavigator | ActionNavigator;

const NAVIGATORS: Navigator[] = [
  {
    key: NavigatorKey.HOME,
    type: NavigatorType.LINK,
    label: '推荐',
    icon: Name.RECOMMEND_FILL,
    link: PLAYER_PATH.RECOMMENDATION,
  },
  {
    key: NavigatorKey.SETTING,
    type: NavigatorType.LINK,
    label: '设置',
    icon: Name.SETTING_OUTLINE,
    link: PLAYER_PATH.SETTING,
  },
];

export { NAVIGATORS };
