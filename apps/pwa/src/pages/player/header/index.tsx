import { memo } from 'react';
import styled from 'styled-components';
import Cover from '#/components/cover';
import mm from '@/global_states/mini_mode';
import IconButton from '#/components/icon_button';
import { MdMenu, MdSearch } from 'react-icons/md';
import useNavigate from '#/utils/use_navigate';
import { PLAYER_PATH, ROOT_PATH } from '@/constants/route';
import Search from './search';
import Title from './title';
import useTitle from './use_title';
import e, { EventType } from '../eventemitter';
import useTitlebar from './use_titlebar';
import { HEADER_HEIGHT } from '../constants';

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
  const miniMode = mm.useState();
  const title = useTitle();
  const { left, right } = useTitlebar();

  return (
    <Style style={{ paddingLeft: left, paddingRight: right }}>
      {miniMode ? (
        <>
          <IconButton onClick={openSidebar}>
            <MdMenu />
          </IconButton>
          <IconButton
            onClick={() =>
              navigate({ path: `${ROOT_PATH.PLAYER}${PLAYER_PATH.SEARCH}` })
            }
          >
            <MdSearch />
          </IconButton>
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
