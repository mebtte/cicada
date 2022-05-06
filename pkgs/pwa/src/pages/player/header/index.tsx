import { memo } from 'react';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';

import Avatar from '@/components/avatar';
import { PLAYER_PATH } from '@/constants/route';
import Search from './search';
import Title from './title';

const Style = styled.div`
  z-index: 2;
  height: 60px;
  display: flex;
  align-items: flex-end;
  padding: 0 20px 10px 20px;
  box-sizing: border-box;
  -webkit-app-region: drag;
`;

function Header() {
  const { pathname } = useLocation();

  let title = '';
  // eslint-disable-next-line default-case
  switch (pathname) {
    case PLAYER_PATH.SEARCH: {
      title = '搜索';
      break;
    }
    case PLAYER_PATH.SETTING: {
      title = '设置';
      break;
    }
  }
  title = title || '知了';
  return (
    <Style>
      <Avatar animated src="/logo.png" size={32} />
      <Title title={title} />
      <Search />
    </Style>
  );
}

export default memo(Header);
