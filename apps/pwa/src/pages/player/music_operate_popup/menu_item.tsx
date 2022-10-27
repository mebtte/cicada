import styled from 'styled-components';
import { HtmlHTMLAttributes, ReactNode } from 'react';
import { CSSVariable } from '#/global_style';

const Style = styled.div`
  padding: 10px 20px;

  display: flex;
  align-items: center;

  color: ${CSSVariable.TEXT_COLOR_PRIMARY};
  user-select: none;
  cursor: pointer;
  transition: all 300ms;

  > .label {
    margin-left: 20px;
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
`;

function MenuItem({
  icon,
  label,
  ...props
}: HtmlHTMLAttributes<HTMLDivElement> & {
  icon: ReactNode;
  label: string;
}) {
  return (
    <Style {...props}>
      {icon}
      <div className="label">{label}</div>
    </Style>
  );
}

export default MenuItem;
