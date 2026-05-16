import { CSSVariable } from '@/global_style';
import capitalize from '@/style/capitalize';
import { CSS_VAR } from '@/components/theme';
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
    border-color 120ms ease-out,
    box-shadow 120ms ease-out,
    filter 120ms ease-out;

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
    border-color: color-mix(
      in srgb,
      var(${CSS_VAR.colorPrimary}) 26%,
      ${CSSVariable.COLOR_BORDER}
    );
    box-shadow: 0 5px 0 color-mix(
      in srgb,
      var(${CSS_VAR.colorPrimaryShadow}) 22%,
      ${CSSVariable.COLOR_BORDER}
    );
    filter: brightness(1.01);
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
