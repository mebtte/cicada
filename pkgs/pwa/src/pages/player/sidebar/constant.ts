/* eslint-disable no-nested-ternary */
import { ROOT_PATH, PLAYER_PATH } from '@/constants/route';
import { Name } from '@/components/icon';
import openLink from '@/utils/open_link';

export enum NavigatorKey {
  HOME,
  SETTING,
  CMS,
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
  {
    key: NavigatorKey.CMS,
    type: NavigatorType.ACTION,
    label: 'CMS',
    icon: Name.CMS_OUTLINE,
    action: () => openLink(`#${ROOT_PATH.CMS}`),
  },
];

export { NAVIGATORS };
