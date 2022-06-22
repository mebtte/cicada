import { memo } from 'react';
import styled from 'styled-components';
import p from '@/global_states/profile';
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
  const profile = p.useState();
  return (
    <Style>
      <User profile={profile!} />
      <Menu />
      <MusicbillList />
    </Style>
  );
}

export default memo(Sidebar);
