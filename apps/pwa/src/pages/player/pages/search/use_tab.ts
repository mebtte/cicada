import useQuery from '@/utils/use_query';
import { Query } from '@/constants';

import { TABS } from './constants';
import { SearchTab } from '../../constants';

export default () => {
  let { search_tab: tab } = useQuery<Query.SEARCH_TAB | Query.KEYWORD>();
  // @ts-expect-error
  tab = TABS.includes(tab) ? tab : SearchTab.MUSIC;

  return tab as SearchTab;
};
