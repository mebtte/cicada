import { memo } from 'react';
import styled from 'styled-components';

import u from '@/global_state/user';
import User from './user';
import MusicbillList from './musicbill_list';
import Menu from './menu';

const Style = styled.div`
  z-index: 2;
  position: relative;
  width: 240px;
  display: flex;
  flex-direction: column;
  gap: 30px;
  padding-top: 30px;
`;

function Sidebar() {
  const user = u.useState();
  return (
    <Style>
      <User user={user!} />
      <Menu />
      <MusicbillList />
    </Style>
  );
}

export default memo(Sidebar);
