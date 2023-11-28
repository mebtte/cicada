import TabList from '@/components/tab_list';
import { t } from '@/i18n';
import { CSSProperties, useContext } from 'react';
import useTitlebarArea from '@/utils/use_titlebar_area_rect';
import { Tab, TAB_LIST_HEIGHT } from './constants';
import context from '../context';

const TAB_MAP_LABEL: Record<Tab, string> = {
  [Tab.PLAYLIST]: t('playlist'),
  [Tab.PLAYQUEUE]: t('playqueue'),
};
const style: CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',

  paddingInline: 20,
  backdropFilter: 'blur(5px)',
};

function Wrapper({
  selectedTab,
  onChange,
}: {
  selectedTab: Tab;
  onChange: (tab: Tab) => void;
}) {
  const { height } = useTitlebarArea();
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
    <TabList
      current={selectedTab}
      onChange={onChange}
      tabList={Object.values(Tab).map((tab) => {
        const count = getCount(tab);
        return {
          tab,
          label: `${TAB_MAP_LABEL[tab]}${count > 0 ? ` (${count})` : ''}`,
        };
      })}
      style={{
        ...style,
        height: height + TAB_LIST_HEIGHT,
        paddingBlockStart: height,
      }}
    />
  );
}

export default Wrapper;
