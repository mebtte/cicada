import { CSSVariable } from '#/global_style';
import { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import styled from 'styled-components';

const Style = styled(NavLink)`
  padding: 5px 20px;

  display: flex;
  align-items: center;
  gap: 10px;

  text-decoration: none;
  color: ${CSSVariable.TEXT_COLOR_PRIMARY};
  transition: 300ms;

  > svg {
    width: 32px;
  }

  > .label {
    font-size: 14px;
  }

  &:hover {
    background-color: rgb(0 0 0 / 0.05);
  }

  &.active {
    color: #fff;
    background-color: ${CSSVariable.COLOR_PRIMARY} !important;
  }
`;

function MenuItem({
  to,
  label,
  icon,
}: {
  to: string;
  label: string;
  icon: ReactNode;
}) {
  return (
    <Style to={to}>
      {icon}
      <div className="label">{label}</div>
    </Style>
  );
}

export default MenuItem;
