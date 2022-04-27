import React from 'react';
import styled from 'styled-components';
import { useLocation } from 'react-router-dom';

import { CMS_PATH } from '@/constants/route';
import { Name } from '@/components/icon';
import MenuItem from './menu_item';
import { Menu } from './constants';

const Style = styled.div`
  width: 200px;
  background: #f6f6f6;
`;
const MENUS: Menu[] = [
  {
    label: '总览',
    icon: Name.DASHBOARD_OUTLINE,
    path: CMS_PATH.DASHBOARD,
  },
  {
    label: '用户',
    icon: Name.ID_FILL,
    path: CMS_PATH.USER,
  },
  {
    label: '角色',
    icon: Name.FIGURE_FILL,
    path: CMS_PATH.FIGURE,
  },
  {
    label: '音乐',
    icon: Name.MUSIC_FILL,
    path: CMS_PATH.MUSIC,
  },
  {
    label: '公共配置',
    icon: Name.SETTING_OUTLINE,
    path: CMS_PATH.PUBLIC_CONFIG,
  },
];

const Sidebar = () => {
  const { pathname } = useLocation();
  return (
    <Style>
      {MENUS.map((menu) => (
        <MenuItem key={menu.path} pathname={pathname} menu={menu} />
      ))}
    </Style>
  );
};

export default Sidebar;
