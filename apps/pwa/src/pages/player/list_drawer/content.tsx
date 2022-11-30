import { useState } from 'react';
import TabList from '#/components/tab_list';
import { useTransition } from 'react-spring';
import styled from 'styled-components';
import Playqueue from './playqueue';
import Playlist from './playlist';
import { Tab, TAB_LIST_HEIGHT } from './constants';

const TAB_MAP_LABEL: Record<Tab, string> = {
  [Tab.PLAYLIST]: '播放列表',
  [Tab.PLAYQUEUE]: '播放队列',
};
const TAB_LIST = Object.values(Tab).map((t) => ({
  tab: t,
  label: TAB_MAP_LABEL[t],
}));
const StyledTabList = styled(TabList)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: ${TAB_LIST_HEIGHT}px;

  padding: 0 20px;

  backdrop-filter: blur(5px);
`;

function Content() {
  const [tab, setTab] = useState(Tab.PLAYQUEUE);

  const transitions = useTransition(tab, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
  });
  return (
    <>
      {transitions((style, t) => {
        switch (t) {
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
      <StyledTabList
        current={tab}
        onChange={(t) => setTab(t)}
        tabList={TAB_LIST}
      />
    </>
  );
}

export default Content;
