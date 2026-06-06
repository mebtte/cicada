import { t } from '@/i18n';
import { SearchTab } from '../../constants';

export const TABS = Object.values(SearchTab);
const TAB_MAP_LABEL: Record<SearchTab, string> = {
  [SearchTab.MUSIC]: t('music'),
  [SearchTab.ARTIST]: t('artist'),
  [SearchTab.LYRIC]: t('lyric'),
  [SearchTab.PUBLIC_MUSICBILL]: t('public_musicbill'),
};
export const TAB_LIST: { tab: SearchTab; label: string }[] = TABS.map(
  (tab) => ({
    tab,
    label: TAB_MAP_LABEL[tab],
  }),
);

export const TOOLBAR_HEIGHT = 76;
export const MINI_MODE_TOOLBAR_HEIGHT = 126;

export const PAGE_SIZE = 50;
