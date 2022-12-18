import { SearchTab } from '../../constants';

export const TABS = Object.values(SearchTab);
const TAB_MAP_LABEL: Record<SearchTab, string> = {
  [SearchTab.MUSIC]: '音乐',
  [SearchTab.SINGER]: '歌手',
  [SearchTab.LYRIC]: '歌词',
  [SearchTab.MUSICBILL]: '乐单',
};
export const TAB_LIST: { tab: SearchTab; label: string }[] = TABS.map(
  (tab) => ({
    tab,
    label: TAB_MAP_LABEL[tab],
  }),
);

export const TOOLBAR_HEIGHT = 45;
export const MINI_MODE_TOOLBAR_HEIGHT = 90;

export const PAGE_SIZE = 50;
