import { CSSVariable } from '@/global_style';
import capitalize from '@/style/capitalize';
import { HtmlHTMLAttributes, ReactNode } from 'react';
import styled, { css } from 'styled-components';

const Style = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, auto);
  align-items: center;
  gap: 14px;
  padding: 16px 18px 20px;

  border: 2px solid ${CSSVariable.COLOR_BORDER};
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 5px 0 ${CSSVariable.COLOR_BORDER};
  transition:
    transform 150ms ease-out,
    box-shadow 150ms ease-out;

  > .label {
    min-width: 0;

    font-family: 'Nunito', 'Varela Round', system-ui, sans-serif;
    font-weight: 800;
    font-size: ${CSSVariable.TEXT_SIZE_LARGE};
    line-height: 1.2;
    color: ${CSSVariable.TEXT_COLOR_PRIMARY};

    ${capitalize}
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 7px 0 ${CSSVariable.COLOR_BORDER};
  }

  ${({ theme: { miniMode } }) =>
    miniMode &&
    css`
      grid-template-columns: 1fr;
      align-items: stretch;
      gap: 12px;
      padding: 14px 14px 18px;
    `}
`;

function Item({
  label,
  children,
  ...props
}: HtmlHTMLAttributes<HTMLDivElement> & {
  label: ReactNode;
}) {
  return (
    <Style {...props}>
      <div className="label">{label}</div>
      {children}
    </Style>
  );
}

export default Item;
