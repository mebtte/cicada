import { Query } from '@/constants';
import useQuery from '@/utils/use_query';
import styled, { css } from 'styled-components';
import TabList from '#/components/tab_list';
import useNavigate from '#/utils/use_navigate';
import mm from '@/global_states/mini_mode';
import Input from './input';
import { HEADER_HEIGHT } from '../../constants';
import Page from '../page';
import { Tab, TABS, TOOLBAR_HEIGHT } from './constants';
import Guide from './guide';
import Content from './content';

const TAB_MAP_LABEL: Record<Tab, string> = {
  [Tab.MUSIC]: '音乐',
  [Tab.SINGER]: '歌手',
  [Tab.LYRIC]: '歌词',
};
const tabList: { tab: Tab; label: string }[] = TABS.map((tab) => ({
  tab,
  label: TAB_MAP_LABEL[tab],
}));
const Style = styled(Page)`
  position: relative;

  margin-top: ${HEADER_HEIGHT}px;

  > .toolbar {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: ${TOOLBAR_HEIGHT}px;

    padding: 0 20px 5px 20px;

    display: flex;
    align-items: flex-end;
    gap: 30px;

    backdrop-filter: blur(5px);

    > .guide-box {
      min-width: 0;
      padding-bottom: 4px;

      text-align: right;
    }
  }

  ${({ theme: { miniMode } }) => css`
    > .toolbar {
      > .guide-box {
        flex: ${miniMode ? 'unset' : 1};
      }
    }
  `}
`;

function Search() {
  let { search_tab: tab } = useQuery<Query.SEARCH_TAB | Query.KEYWORD>();
  // @ts-expect-error
  tab = TABS.includes(tab) ? tab : Tab.MUSIC;
  const navigate = useNavigate();
  const miniMode = mm.useState();

  return (
    <Style>
      <Content tab={tab as Tab} />
      <div className="toolbar">
        {miniMode ? <Input /> : null}
        <TabList<Tab>
          current={tab as Tab}
          tabList={tabList}
          onChange={(t) =>
            navigate({
              query: {
                [Query.SEARCH_TAB]: t,
                [Query.PAGE]: 1,
              },
            })
          }
        />
        <div className="guide-box">
          <Guide />
        </div>
      </div>
    </Style>
  );
}

export default Search;
