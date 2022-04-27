import React from 'react';
import styled, { css } from 'styled-components';
import { Link } from 'react-router-dom';

import Icon from '@/components/icon';
import { Menu as MenuType } from './constants';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Style = styled(({ active, ...props }) => <Link {...props} />)<{
  active: boolean;
}>`
  text-decoration: none;
  display: flex;
  align-items: center;
  padding: 15px 20px;
  transition: 300ms;
  > .icon {
    color: inherit;
  }
  > .label {
    font-size: 14px;
    margin-left: 20px;
    color: inherit;
  }
  &:hover {
    background-color: rgb(49 194 124 / 0.05);
  }
  ${({ active }) => css`
    color: ${active ? '#fff' : 'var(--color-primary)'};
    background-color: ${active
      ? 'var(--color-primary) !important'
      : 'transparent'};
  `}
`;

const MenuItem = ({ menu, pathname }: { menu: MenuType; pathname: string }) => {
  const { icon, path, label } = menu;
  return (
    <Style to={path} active={path === pathname}>
      <Icon className="icon" name={icon} size={16} />
      <div className="label">{label}</div>
    </Style>
  );
};

export default MenuItem;
