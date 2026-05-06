import { Query } from '@/constants';
import styled, { css } from 'styled-components';
import { DuolingoTabList } from '@/components/duolingo_tabs';
import useNavigate from '@/utils/use_navigate';
import Input from './input';
import { SearchTab } from '../../constants';
import Page from '../page';
import {
  MINI_MODE_TOOLBAR_HEIGHT,
  TAB_LIST,
  TOOLBAR_HEIGHT,
} from './constants';
import Content from './content';
import useTab from './use_tab';
import { useTheme } from '@/global_states/theme';

const Style = styled(Page)`
  position: relative;

  > .toolbar {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;

    padding: 10px 20px;

    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 8px;

    background-color: #fff;
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
        {useTheme().miniMode ? <Input /> : null}
        <DuolingoTabList<SearchTab>
          current={tab}
          tabList={TAB_LIST}
          onChange={(t) =>
            navigate({
              query: {
                [Query.SEARCH_TAB]: t,
              },
            })
          }
        />
      </div>
    </Style>
  );
}

export default Search;
