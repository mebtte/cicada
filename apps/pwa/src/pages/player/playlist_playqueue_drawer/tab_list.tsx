import { DuolingoTabList } from '@/components';
import { t } from '@/i18n';
import { useContext } from 'react';
import styled from 'styled-components';
import { Tab, TAB_LIST_HEIGHT } from './constants';
import context from '../context';

const TAB_MAP_LABEL: Record<Tab, string> = {
  [Tab.PLAYLIST]: t('playlist'),
  [Tab.PLAYQUEUE]: t('playqueue'),
};

const Toolbar = styled.div`
  position: absolute;
  left: 0;
  bottom: 0;
  z-index: 2;
  width: 100%;
  height: calc(${TAB_LIST_HEIGHT}px + env(safe-area-inset-bottom, 0));

  display: flex;
  align-items: flex-start;

  padding: 10px 16px calc(env(safe-area-inset-bottom, 0) + 12px);
  background: rgb(255 255 255 / 0.94);
  border-top: 2px solid rgb(232 232 232);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
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
      <DuolingoTabList<Tab>
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
