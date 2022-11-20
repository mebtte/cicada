import useQuery from '@/utils/use_query';
import { Query } from '@/constants';
import { useMemo } from 'react';
import { Tab, TABS } from './constants';

const TAB_MAP_LABEL: Record<Tab, string> = {
  [Tab.MUSIC]: '音乐',
  [Tab.SINGER]: '歌手',
  [Tab.LYRIC]: '歌词',
  [Tab.MUSICBILL]: '乐单',
};

const EXPLORATION_TABS = TABS.filter((t) => t !== Tab.LYRIC);

const searchTabList: { tab: Tab; label: string }[] = TABS.map((tab) => ({
  tab,
  label: TAB_MAP_LABEL[tab],
}));
const explorationTabList = searchTabList.filter((t) => t.tab !== Tab.LYRIC);

export default (exploration: boolean) => {
  let { search_tab: tab } = useQuery<Query.SEARCH_TAB | Query.KEYWORD>();
  // @ts-expect-error
  tab = (exploration ? EXPLORATION_TABS : TABS).includes(tab) ? tab : Tab.MUSIC;

  const tabList = useMemo(
    () => (exploration ? explorationTabList : searchTabList),
    [exploration],
  );

  return { tab: tab as Tab, tabList };
};
