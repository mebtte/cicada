import { memo } from 'react';
import styled from 'styled-components';
import Cover from '@/components/cover';
import Button from '@/components_next/button';
import { MdArrowBack, MdMenu, MdSearch } from 'react-icons/md';
import {
  matchPath,
  useLocation,
  useNavigate as useRouterNavigate,
} from 'react-router-dom';
import useNavigate from '@/utils/use_navigate';
import { PLAYER_PATH, ROOT_PATH } from '@/constants/route';
import Search from './search';
import Title from './title';
import useTitle from './use_title';
import e, { EventType } from '../eventemitter';
import useTitlebar from './use_titlebar';
import { HEADER_HEIGHT } from '../constants';
import { useTheme } from '@/global_states/theme';

const openSidebar = () => e.emit(EventType.MINI_MODE_OPEN_SIDEBAR, null);
const Style = styled.div`
  z-index: 1;

  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: ${HEADER_HEIGHT}px;

  display: flex;
  align-items: center;
  gap: 15px;

  backdrop-filter: blur(5px);
  -webkit-app-region: drag;
`;

function Header() {
  const navigate = useNavigate();
  const routerNavigate = useRouterNavigate();
  const { pathname } = useLocation();
  const { miniMode } = useTheme();
  const title = useTitle();
  const { left, right } = useTitlebar();
  const musicbillMatch = matchPath(
    `${ROOT_PATH.PLAYER}${PLAYER_PATH.MUSICBILL}`,
    pathname,
  );
  const musicMatch = matchPath(
    `${ROOT_PATH.PLAYER}${PLAYER_PATH.MUSIC}`,
    pathname,
  );
  const singerMatch = matchPath(
    `${ROOT_PATH.PLAYER}${PLAYER_PATH.SINGER}`,
    pathname,
  );
  const showBackButton =
    miniMode && !!(musicMatch || musicbillMatch || singerMatch);

  return (
    <Style style={{ paddingLeft: left, paddingRight: right }}>
      {miniMode ? (
        <>
          <Button
            square
            variant="plain"
            size="sm"
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
            variant="plain"
            size="sm"
            onClick={() =>
              navigate({ path: `${ROOT_PATH.PLAYER}${PLAYER_PATH.SEARCH}` })
            }
          >
            <MdSearch />
          </Button>
        </>
      ) : (
        <Cover src="/logo.png" size={24} />
      )}
      <Title title={title} />
      {miniMode ? null : <Search />}
    </Style>
  );
}

export default memo(Header);
