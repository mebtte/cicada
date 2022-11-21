import useQuery from '@/utils/use_query';
import { Query } from '@/constants';
import { useMemo } from 'react';
import { TABS } from './constants';
import { SearchTab } from '../../constants';

const TAB_MAP_LABEL: Record<SearchTab, string> = {
  [SearchTab.MUSIC]: '音乐',
  [SearchTab.SINGER]: '歌手',
  [SearchTab.LYRIC]: '歌词',
  [SearchTab.MUSICBILL]: '乐单',
};

const EXPLORATION_TABS = TABS.filter((t) => t !== SearchTab.LYRIC);

const searchTabList: { tab: SearchTab; label: string }[] = TABS.map((tab) => ({
  tab,
  label: TAB_MAP_LABEL[tab],
}));
const explorationTabList = searchTabList.filter(
  (t) => t.tab !== SearchTab.LYRIC,
);

export default (exploration: boolean) => {
  let { search_tab: tab } = useQuery<Query.SEARCH_TAB | Query.KEYWORD>();
  // @ts-expect-error
  tab = (exploration ? EXPLORATION_TABS : TABS).includes(tab)
    ? tab
    : SearchTab.MUSIC;

  const tabList = useMemo(
    () => (exploration ? explorationTabList : searchTabList),
    [exploration],
  );

  return { tab: tab as SearchTab, tabList };
};
