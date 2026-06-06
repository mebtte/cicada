import { memo } from 'react';
import styled from 'styled-components';
import Cover from '@/components/cover';
import Button from '@/components/button';
import { Search as SearchIcon, ArrowBack, Menu as MenuIcon } from '@/components/icon';
import { useLocation, useNavigate as useRouterNavigate } from 'react-router-dom';
import useNavigate from '@/utils/use_navigate';
import { ROOT_PATH } from '@/constants/route';
import Search from './search';
import Title from './title';
import useTitle from './use_title';
import e, { EventType } from '../eventemitter';
import useTitlebar from './use_titlebar';
import { EXPLORATION_FOCUS_SEARCH_STATE, HEADER_HEIGHT } from '../constants';
import { useTheme } from '@/global_states/theme';
import { CSSVariable } from '@/global_style';
import { getIsHeaderBackButtonPath } from './back_button';

const openSidebar = () => e.emit(EventType.MINI_MODE_OPEN_SIDEBAR, null);
const Style = styled.div`
  z-index: 1;

  position: relative;
  flex: 0 0 ${HEADER_HEIGHT}px;
  width: 100%;
  height: ${HEADER_HEIGHT}px;

  display: flex;
  align-items: center;
  gap: 18px;

  color: ${CSSVariable.TEXT_COLOR_PRIMARY};
  background: #fff;
  border-bottom: 2px solid ${CSSVariable.COLOR_BORDER};
  box-shadow: 0 3px 0 ${CSSVariable.COLOR_SURFACE_SHADOW};
  -webkit-app-region: drag;
`;

function Header() {
  const navigate = useNavigate();
  const routerNavigate = useRouterNavigate();
  const { pathname } = useLocation();
  const { miniMode } = useTheme();
  const title = useTitle();
  const { left, right } = useTitlebar();
  const showBackButton = miniMode && getIsHeaderBackButtonPath(pathname);

  return (
    <Style style={{ paddingLeft: left, paddingRight: right }}>
      {miniMode ? (
        <>
          <Button
            square
            variant="ghost"
            size="md"
            onClick={() => {
              if (showBackButton) {
                if (window.history.length > 1) {
                  routerNavigate(-1);
                  return;
                }
                navigate({ path: ROOT_PATH.PLAYER });
                return;
              }
              openSidebar();
            }}
          >
            {showBackButton ? <ArrowBack /> : <MenuIcon />}
          </Button>
          <Button
            square
            variant="ghost"
            size="md"
            onClick={() => {
              // 跳转到发现页并通过路由 state 通知其聚焦搜索框。
              // 已在发现页时, 该跳转的目标地址与当前一致, useNavigate 会去重而不触发跳转,
              // 搜索框也就不会重新挂载/聚焦, 满足 "已在发现页则不自动聚焦" 的要求。
              navigate({
                path: ROOT_PATH.PLAYER,
                query: {
                  keyword: null,
                  page: null,
                  search_tab: null,
                },
                state: { [EXPLORATION_FOCUS_SEARCH_STATE]: true },
              });
            }}
          >
            <SearchIcon />
          </Button>
        </>
      ) : (
        <Cover src="/logo.png" size={30} />
      )}
      <Title title={title.title} description={title.description} />
      {miniMode ? null : <Search />}
    </Style>
  );
}

export default memo(Header);
