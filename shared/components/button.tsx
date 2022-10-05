import { ButtonHTMLAttributes } from 'react';
import styled, { css } from 'styled-components';
import { ComponentSize } from '../constants/style';
import { CSSVariable } from '../global_style';

export enum Variant {
  NORMAL = 'normal',
  PRIMARY = 'primary',
}
const VARIANT_MAP: Record<
  Variant,
  {
    css: ReturnType<typeof css>;
  }
> = {
  [Variant.NORMAL]: {
    css: css`
      border: 1px solid rgb(188 188 188);
      background-color: transparent;
      background-clip: content-box;
      color: ${CSSVariable.TEXT_COLOR_PRIMARY};

      &:hover {
        background-color: rgb(0 0 0 / 0.05);
      }

      &:active {
        background-color: rgb(0 0 0 / 0.1);
      }

      &:disabled {
        background-color: rgb(0 0 0 / 0.15);
        border-color: rgb(0 0 0 / 0.15);
        color: ${CSSVariable.TEXT_COLOR_SECONDARY};
      }
    `,
  },
  [Variant.PRIMARY]: {
    css: css`
      border: none;
      background-color: ${CSSVariable.COLOR_PRIMARY};
      color: #fff;

      &:hover {
        background-color: #24a06d;
      }

      &:active {
        background-color: #1d8b5e;
      }

      &:disabled {
        background-color: ${CSSVariable.COLOR_PRIMARY_DISABLED};
      }
    `,
  },
};
const Style = styled.button<{ variant: Variant }>`
  height: ${ComponentSize.NORMAL}px;
  padding: 0;

  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 300ms;

  &:disabled {
    cursor: not-allowed;
  }

  ${({ variant }) => {
    const variantCss = VARIANT_MAP[variant].css;
    return css`
      ${variantCss}
    `;
  }}
`;

function Button({
  variant = Variant.NORMAL,
  loading = false,
  disabled = false,
  children,
  ...props
}: {
  variant?: Variant;
  loading?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <Style
      type="button"
      {...props}
      variant={variant}
      disabled={loading || disabled}
    >
      {children}
    </Style>
  );
}

export default Button;
