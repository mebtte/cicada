import { memo } from 'react';
import styled from 'styled-components';
import Cover from '@/components/cover';
import Button from '@/components/button';
import { MdArrowBack, MdMenu, MdSearch } from 'react-icons/md';
import { useLocation, useNavigate as useRouterNavigate } from 'react-router-dom';
import useNavigate from '@/utils/use_navigate';
import { ROOT_PATH } from '@/constants/route';
import Search from './search';
import Title from './title';
import useTitle from './use_title';
import e, { EventType } from '../eventemitter';
import useTitlebar from './use_titlebar';
import { HEADER_HEIGHT } from '../constants';
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
  box-shadow: 0 3px 0 rgb(214 214 214);
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
            {showBackButton ? <MdArrowBack /> : <MdMenu />}
          </Button>
          <Button
            square
            variant="ghost"
            size="md"
            onClick={() => {
              navigate({
                path: ROOT_PATH.PLAYER,
                query: {
                  keyword: null,
                  page: null,
                  search_tab: null,
                },
              });
              window.requestAnimationFrame(() =>
                e.emit(EventType.FOCUS_SEARCH_INPUT, null),
              );
            }}
          >
            <MdSearch />
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
