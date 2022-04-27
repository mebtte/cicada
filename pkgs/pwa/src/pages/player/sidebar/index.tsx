import React from 'react';
import styled from 'styled-components';
import { useSelector } from 'react-redux';

import { User as UserType } from '@/constants/user';
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

const Sidebar = () => {
  const { user } = useSelector(({ user: u }: { user: UserType }) => ({
    user: u,
  }));
  return (
    <Style>
      <User user={user} />
      <Menu user={user} />
      <MusicbillList />
    </Style>
  );
};

export default React.memo(Sidebar);
