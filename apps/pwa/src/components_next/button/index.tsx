import { ButtonHTMLAttributes, ReactNode } from 'react';
import styled, { css, keyframes } from 'styled-components';
import { CSS_VAR } from '../theme';

export type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'plain';
export type Size = 'sm' | 'md' | 'lg';

const cn = (v: string) => `var(${v})`;
const PRIMARY        = cn(CSS_VAR.colorPrimary);
const PRIMARY_SHADOW = cn(CSS_VAR.colorPrimaryShadow);

// ─── 阴影偏移量 ────────────────────────────────────────────────────────────────

const SHADOW_OFFSET: Record<Size, number> = { sm: 3, md: 4, lg: 5 };

// ─── 尺寸 ─────────────────────────────────────────────────────────────────────

const SIZE_MAP: Record<Size, ReturnType<typeof css>> = {
  sm: css`
    height: 34px;
    padding: 0 14px;
    font-size: 13px;
    border-radius: 10px;
    border-width: 2px;
  `,
  md: css`
    height: 44px;
    padding: 0 20px;
    font-size: 15px;
    border-radius: 13px;
    border-width: 2px;
  `,
  lg: css`
    height: 54px;
    padding: 0 26px;
    font-size: 17px;
    border-radius: 16px;
    border-width: 2px;
  `,
};

// ─── 变体 ─────────────────────────────────────────────────────────────────────
//
// Duolingo 核心公式：
//   正常  — 纯色填充 + 底部纯色硬阴影（无 blur）
//   悬停  — 整体略亮（filter brightness）
//   按下  — translateY(offset) + box-shadow 归零
//   释放  — 慢速弹回（150ms ease-out）
//   禁用  — 去阴影 + 降不透明度

const makeVariant = (
  face: string,
  shadow: string,
  textColor = '#fff',
) => css<{ $offset: number }>`
  color: ${textColor};
  background: ${face};
  border-color: ${shadow};
  transition:
    transform 150ms ease-out,
    box-shadow 150ms ease-out,
    filter 120ms;

  box-shadow: 0 ${({ $offset }) => $offset}px 0 ${shadow};

  &:not(:disabled):hover {
    filter: brightness(1.06);
  }

  &:not(:disabled):active {
    transform: translateY(${({ $offset }) => $offset}px);
    box-shadow: none;
    transition:
      transform 60ms ease-in,
      box-shadow 60ms ease-in,
      filter 60ms;
  }

  &:disabled {
    box-shadow: none;
    opacity: 0.5;
  }
`;

const plainVariant = css<{ $offset: number }>`
  color: inherit;
  background: transparent;
  border-color: transparent;
  box-shadow: none;
  transition: background 120ms;

  &:not(:disabled):hover {
    background: rgb(0 0 0 / 0.06);
  }

  &:not(:disabled):active {
    background: rgb(0 0 0 / 0.12);
  }

  &:disabled {
    box-shadow: none;
    opacity: 0.5;
  }
`;

const VARIANT_MAP: Record<Variant, ReturnType<typeof css>> = {
  primary:   makeVariant(PRIMARY,   PRIMARY_SHADOW),
  secondary: makeVariant('#ffffff', PRIMARY,        PRIMARY),
  ghost:     makeVariant('#ffffff', 'rgb(180 180 180)', 'rgb(88 88 88)'),
  danger:    makeVariant('rgb(242 80 66)', 'rgb(190 46 34)'),
  plain:     plainVariant,
};

// ─── Loader ───────────────────────────────────────────────────────────────────

const spin = keyframes`to { transform: rotate(360deg); }`;

const Loader = styled.span<{ $size: Size }>`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;

  &::after {
    content: '';
    border-radius: 50%;
    border: 2px solid currentColor;
    border-top-color: transparent;
    opacity: 0.8;
    animation: ${spin} 0.55s linear infinite;
    ${({ $size }) => {
      const s = $size === 'sm' ? 14 : $size === 'lg' ? 20 : 17;
      return css`width: ${s}px; height: ${s}px;`;
    }}
  }
`;

// ─── Root ─────────────────────────────────────────────────────────────────────

const StyledButton = styled.button<{
  $variant: Variant;
  $size: Size;
  $block: boolean;
  $loading: boolean;
  $offset: number;
  $square: boolean;
}>`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;

  font-family: 'Nunito', 'Varela Round', system-ui, sans-serif;
  font-weight: 700;
  letter-spacing: 0.3px;
  text-transform: capitalize;
  white-space: nowrap;
  border-style: solid;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  will-change: transform, box-shadow;

  width: ${({ $block }) => ($block ? '100%' : 'auto')};

  &:focus-visible {
    outline: 3px solid ${PRIMARY};
    outline-offset: 3px;
  }

  &:disabled {
    cursor: not-allowed;
  }

  > .btn-label {
    display: contents;
    transition: opacity 100ms;
    opacity: ${({ $loading }) => ($loading ? 0 : 1)};
  }

  ${({ $size }) => SIZE_MAP[$size]}
  ${({ $square }) => $square && css`
    aspect-ratio: 1;
    padding: 0;
  `}
  ${({ $variant, $offset }) => css`
    ${VARIANT_MAP[$variant]}
    --offset: ${$offset}px;
  `}
`;

// ─── Component ────────────────────────────────────────────────────────────────

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  block?: boolean;
  square?: boolean;
  icon?: ReactNode;
}

function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  block = false,
  square = false,
  disabled = false,
  icon,
  children,
  ...rest
}: ButtonProps) {
  const offset = SHADOW_OFFSET[size];
  return (
    <StyledButton
      type="button"
      $variant={variant}
      $size={size}
      $block={block}
      $square={square}
      $loading={loading}
      $offset={offset}
      disabled={loading || disabled}
      {...rest}
    >
      {loading && <Loader $size={size} />}
      <span className="btn-label">
        {icon}
        {children}
      </span>
    </StyledButton>
  );
}

export default Button;
