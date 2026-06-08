import { TabList } from '@/components';
import { t } from '@/i18n';
import { useContext } from 'react';
import styled from 'styled-components';
import { Tab } from './constants';
import context from '../context';

const TAB_MAP_LABEL: Record<Tab, string> = {
  [Tab.PLAYLIST]: t('playlist'),
  [Tab.PLAYQUEUE]: t('playqueue'),
};

const Toolbar = styled.div`
  position: absolute;
  left: 32px;
  right: 32px;
  bottom: calc(12px + env(safe-area-inset-bottom, 0));
  z-index: 2;

  display: flex;
  align-items: center;

  pointer-events: none;

  > * {
    pointer-events: auto;
  }
`;

function Wrapper({
  selectedTab,
  onChange,
}: {
  selectedTab: Tab;
  onChange: (tab: Tab) => void;
}) {
  const { playlist, playqueue } = useContext(context);
  const getCount = (tab: Tab) => {
    switch (tab) {
      case Tab.PLAYLIST: {
        return playlist.length;
      }
      case Tab.PLAYQUEUE: {
        return playqueue.length;
      }
      default: {
        return 0;
      }
    }
  };
  return (
    <Toolbar>
      <TabList<Tab>
        current={selectedTab}
        onChange={onChange}
        tabList={Object.values(Tab).map((tab) => {
          const count = getCount(tab);
          return {
            tab,
            label: `${TAB_MAP_LABEL[tab]}${count > 0 ? ` (${count})` : ''}`,
          };
        })}
        style={{ width: '100%' }}
      />
    </Toolbar>
  );
}

export default Wrapper;
