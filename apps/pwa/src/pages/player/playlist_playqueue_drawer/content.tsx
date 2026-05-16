import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { DuolingoTabPanels } from '@/components';
import Playqueue from './playqueue';
import Playlist from './playlist';
import { Tab } from './constants';
import cache, { CacheKey } from './cache';
import TabList from './tab_list';

const Style = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 100%;
  background: rgb(247 247 247);
`;

function Content() {
  const [selectedTab, setSelectedTab] = useState(
    () => cache.get(CacheKey.SELECTED_TAB) || Tab.PLAYQUEUE,
  );

  useEffect(() => {
    cache.set({
      key: CacheKey.SELECTED_TAB,
      value: selectedTab,
      ttl: Infinity,
    });
  }, [selectedTab]);

  return (
    <Style>
      <DuolingoTabPanels<Tab>
        current={selectedTab}
        tabList={[
          {
            tab: Tab.PLAYQUEUE,
            content: <Playqueue />,
          },
          {
            tab: Tab.PLAYLIST,
            content: <Playlist />,
          },
        ]}
      />
      <TabList selectedTab={selectedTab} onChange={setSelectedTab} />
    </Style>
  );
}

export default Content;
