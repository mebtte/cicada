import styled, { css } from 'styled-components';
import { HtmlHTMLAttributes, ReactNode } from 'react';
import capitalize from '@/style/capitalize';
import { CSSVariable } from '../global_style';

const Style = styled.div<{ active: boolean }>`
  padding: 8px 10px;

  display: flex;
  align-items: center;
  gap: 10px;

  -webkit-tap-highlight-color: transparent;
  user-select: none;
  cursor: pointer;
  transition: all 300ms;
  border-radius: ${CSSVariable.BORDER_RADIUS_NORMAL};

  > .label {
    font-size: ${CSSVariable.TEXT_SIZE_NORMAL};
    ${capitalize}
  }

  > svg {
    width: 20px;
    height: 20px;
  }

  &:hover {
    background-color: ${CSSVariable.BACKGROUND_COLOR_LEVEL_ONE};
  }

  &:active {
    background-color: ${CSSVariable.BACKGROUND_COLOR_LEVEL_TWO};
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
