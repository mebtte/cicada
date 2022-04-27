import React from 'react';
import styled from 'styled-components';

import Icon, { Name } from '@/components/icon';

const Style = styled.div`
  padding: 10px 20px;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: all 300ms;
  > .label {
    margin-left: 20px;
    font-size: 12px;
  }
  &:hover {
    background-color: rgb(0 0 0 / 0.05);
  }
  &:active {
    background-color: rgb(0 0 0 / 0.1);
  }
`;

const ICON_SIZE = 14;

const MenuItem = ({
  icon,
  label,
  ...props
}: {
  icon: Name;
  label: string;
  [key: string]: any;
}) => {
  return (
    <Style {...props}>
      <Icon className="icon" name={icon} size={ICON_SIZE} />
      <div className="label">{label}</div>
    </Style>
  );
};

export default MenuItem;
