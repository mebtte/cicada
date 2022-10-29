import styled, { css } from 'styled-components';
import { HtmlHTMLAttributes, ReactNode } from 'react';
import { CSSVariable } from '../global_style';

const Style = styled.div<{ active: boolean }>`
  padding: 8px 20px;

  display: flex;
  align-items: center;
  gap: 10px;

  user-select: none;
  cursor: pointer;
  transition: all 300ms;

  > .label {
    font-size: 14px;
  }

  > svg {
    width: 20px;
    height: 20px;
  }

  &:hover {
    background-color: rgb(0 0 0 / 0.05);
  }

  &:active {
    background-color: rgb(0 0 0 / 0.1);
  }

  ${({ active }) => css`
    color: ${active ? '#fff !important' : CSSVariable.TEXT_COLOR_PRIMARY};
    background-color: ${active
      ? `${CSSVariable.COLOR_PRIMARY} !important`
      : 'transparent'};
  `}
`;

function MenuItem({
  active = false,
  icon,
  label,
  ...props
}: HtmlHTMLAttributes<HTMLDivElement> & {
  active?: boolean;
  icon: ReactNode;
  label: string;
}) {
  return (
    <Style {...props} active={active}>
      {icon}
      <div className="label">{label}</div>
    </Style>
  );
}

export default MenuItem;
