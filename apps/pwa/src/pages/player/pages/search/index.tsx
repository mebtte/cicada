import { Query } from '@/constants';
import styled, { css } from 'styled-components';
import TabList from '@/components/tab_list';
import useNavigate from '@/utils/use_navigate';
import theme from '@/global_states/theme';
import Input from './input';
import { HEADER_HEIGHT, SearchTab } from '../../constants';
import Page from '../page';
import {
  MINI_MODE_TOOLBAR_HEIGHT,
  TAB_LIST,
  TOOLBAR_HEIGHT,
} from './constants';
import Content from './content';
import useTab from './use_tab';

const Style = styled(Page)`
  position: relative;

  margin-top: ${HEADER_HEIGHT}px;

  > .toolbar {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;

    padding: 0 20px 5px 20px;

    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 5px;

    backdrop-filter: blur(5px);
  }

  ${({ theme: { miniMode } }) => css`
    > .toolbar {
      height: ${miniMode ? MINI_MODE_TOOLBAR_HEIGHT : TOOLBAR_HEIGHT}px;

      > .guide-box {
        flex: ${miniMode ? 'unset' : 1};
      }
    }
  `}
`;

function Search() {
  const navigate = useNavigate();
  const tab = useTab();

  return (
    <Style>
      <Content tab={tab} />
      <div className="toolbar">
        {theme.useState().miniMode ? <Input /> : null}
        <TabList<SearchTab>
          current={tab}
          tabList={TAB_LIST}
          onChange={(t) =>
            navigate({
              query: {
                [Query.SEARCH_TAB]: t,
                [Query.PAGE]: 1,
              },
            })
          }
        />
      </div>
    </Style>
  );
}

export default Search;
