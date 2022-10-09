import { memo } from 'react';
import styled, { css } from 'styled-components';
import Cover from '#/components/cover';
import mm from '@/global_states/mini_mode';
import IconButton from '#/components/icon_button';
import { MdMenu } from 'react-icons/md';
import Search from './search';
import Title from './title';
import useTitle from './use_title';
import e, { EventType } from '../eventemitter';

const openSidebar = () => e.emit(EventType.MINI_MODE_OPEN_SIDEBAR, null);
const Style = styled.div`
  height: 55px;

  display: flex;
  align-items: center;
  gap: 10px;

  box-sizing: border-box;
  -webkit-app-region: drag;

  ${({ theme: { miniMode } }) => css`
    padding: 0 ${miniMode ? 15 : 20}px;
  `}
`;

function Header() {
  const miniMode = mm.useState();
  const title = useTitle();
  return (
    <Style>
      {miniMode ? (
        <IconButton onClick={openSidebar}>
          <MdMenu />
        </IconButton>
      ) : (
        <Cover src="/logo.png" size={24} />
      )}
      <Title title={title} />
      <Search />
    </Style>
  );
}

export default memo(Header);
