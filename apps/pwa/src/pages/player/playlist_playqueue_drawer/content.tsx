import { useEffect, useState } from 'react';
import { useTransition } from 'react-spring';
import Playqueue from './playqueue';
import Playlist from './playlist';
import { Tab } from './constants';
import cache, { CacheKey } from './cache';
import TabList from './tab_list';

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

  const transitions = useTransition(selectedTab, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
  });

  return (
    <>
      {transitions((style, tab) => {
        switch (tab) {
          case Tab.PLAYLIST: {
            return <Playlist style={style} />;
          }

          case Tab.PLAYQUEUE: {
            return <Playqueue style={style} />;
          }

          default: {
            return null;
          }
        }
      })}
      <TabList selectedTab={selectedTab} onChange={setSelectedTab} />
    </>
  );
}

export default Content;
