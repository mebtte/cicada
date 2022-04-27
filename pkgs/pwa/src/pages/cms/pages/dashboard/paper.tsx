import React from 'react';
import styled from 'styled-components';

import Icon, { Name } from '@/components/icon';

const Style = styled.div`
  margin: 15px;
  background-color: #f9f9f9;
  box-shadow: 0px 2px 1px -1px rgb(0 0 0 / 20%),
    0px 1px 1px 0px rgb(0 0 0 / 14%), 0px 1px 3px 0px rgb(0 0 0 / 12%);
  display: inline-flex;
  gap: 30px;
  padding: 40px 0;
  box-sizing: border-box;
  flex-direction: column;
  align-items: center;
  width: 250px;
  height: 250px;
  border-radius: 4px;
  transition: 300ms;
  &:hover {
    box-shadow: 0px 3px 3px -2px rgb(0 0 0 / 20%),
      0px 3px 4px 0px rgb(0 0 0 / 14%), 0px 1px 8px 0px rgb(0 0 0 / 12%);
  }
  > .label {
    font-size: 12px;
    color: #888;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  > .value {
    font-size: 56px;
    font-weight: bold;
    color: #333;
  }
  > .action {
    display: flex;
    align-items: center;
    gap: 10px;
  }
`;

const Paper = ({
  icon,
  label,
  value,
  children,
  ...props
}: React.PropsWithChildren<{
  icon: Name;
  label: string;
  value: string;
  [key: string]: any;
}>) => (
  <Style {...props}>
    <div className="label">
      <Icon name={icon} size={16} />
      <div className="text">{label}</div>
    </div>
    <div className="value">{value}</div>
    <div className="action">{children}</div>
  </Style>
);

export default Paper;
