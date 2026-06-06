import {
  ButtonHTMLAttributes,
  MouseEvent as ReactMouseEvent,
  ReactNode,
  forwardRef,
} from 'react';
import styled, { css, keyframes } from 'styled-components';
import { CSSVariable } from '@/global_style';
import { CSS_VAR } from '../theme';

export type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'plain';
export type Size = 'sm' | 'md' | 'lg';

const cn = (v: string) => `var(${v})`;
const PRIMARY        = cn(CSS_VAR.colorPrimary);
const PRIMARY_SHADOW = cn(CSS_VAR.colorPrimaryShadow);
const CONTROL_NEUTRAL = CSSVariable.COLOR_CONTROL_NEUTRAL;
const DISABLED_SHADOW = CSSVariable.COLOR_DISABLED_SHADOW;

// ─── 阴影偏移量 ────────────────────────────────────────────────────────────────

const SHADOW_OFFSET: Record<Size, number> = { sm: 3, md: 4, lg: 5 };

// 纯图标按钮使用更大的图标（约按钮高度 50%），让视觉重心居中
const SQUARE_ICON_SIZE: Record<Size, number> = { sm: 18, md: 22, lg: 28 };

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
//   悬停  — 向上抬起 2px + 阴影加深（同步播放器发现页卡片）
//   按下  — translateY(offset) + box-shadow 归零
//   释放  — 慢速弹回（150ms ease-out）
//   禁用  — 保留更浅的硬阴影，避免视觉高度变矮

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
    box-shadow 150ms ease-out;

  box-shadow: 0 ${({ $offset }) => $offset}px 0 ${shadow};

  &:not(:disabled):hover {
    transform: translateY(-2px);
    box-shadow: 0 ${({ $offset }) => $offset + 2}px 0 ${shadow};
  }

  &:not(:disabled):active {
    transform: translateY(${({ $offset }) => $offset}px);
    box-shadow: none;
    transition:
      transform 60ms ease-in,
      box-shadow 60ms ease-in;
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
  }
`;

const VARIANT_MAP: Record<Variant, ReturnType<typeof css>> = {
  primary:   makeVariant(PRIMARY,   PRIMARY_SHADOW),
  secondary: makeVariant('#ffffff', PRIMARY,        PRIMARY),
  ghost:     makeVariant('#ffffff', CONTROL_NEUTRAL, 'rgb(88 88 88)'),
  danger:    makeVariant('rgb(242 80 66)', 'rgb(190 46 34)'),
  plain:     plainVariant,
};

const FOCUS_RING_MAP: Record<Variant, string> = {
  primary: PRIMARY,
  secondary: PRIMARY,
  ghost: CONTROL_NEUTRAL,
  danger: 'rgb(242 80 66)',
  plain: PRIMARY,
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
  appearance: none;
  -webkit-appearance: none;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  will-change: transform, box-shadow;

  width: ${({ $block }) => ($block ? '100%' : 'auto')};

  &:focus-visible {
    outline: 3px solid ${({ $variant }) => FOCUS_RING_MAP[$variant]};
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
  ${({ $square, $size }) => $square && css`
    aspect-ratio: 1;
    padding: 0;
    font-size: ${SQUARE_ICON_SIZE[$size]}px;
  `}
  ${({ $variant, $offset }) => css`
    ${VARIANT_MAP[$variant]}
    --offset: ${$offset}px;
  `}
  // loading 时同样会设置 disabled，保留禁用外观避免提交中看起来仍可点击。
  ${({ $offset, $variant }) =>
    $variant === 'plain'
      ? css`
          &:disabled {
            color: ${CSSVariable.TEXT_COLOR_DISABLED};
            background: transparent;
            border-color: transparent;
            box-shadow: none;
            filter: grayscale(1);
          }
        `
      : css`
          &:disabled {
            color: ${CSSVariable.TEXT_COLOR_SECONDARY};
            background: ${CSSVariable.BACKGROUND_DISABLED};
            border-color: ${CSSVariable.COLOR_DISABLED_SHADOW};
            box-shadow: 0 ${$offset}px 0 ${CSSVariable.COLOR_DISABLED_SHADOW};
            filter: grayscale(1);
          }

          &:disabled:hover,
          &:disabled:active {
            transform: none;
            box-shadow: 0 ${$offset}px 0 ${CSSVariable.COLOR_DISABLED_SHADOW};
            filter: grayscale(1);
          }
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

// forwardRef 让 Button 可以作为 Tooltip / Radix 等定位库的触发元素
const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    block = false,
    square = false,
    disabled = false,
    icon,
    children,
    onClick,
    ...rest
  },
  ref,
) {
  const offset = SHADOW_OFFSET[size];
  const handleClick = (event: ReactMouseEvent<HTMLButtonElement>) => {
    onClick?.(event);

    if (event.detail > 0) {
      event.currentTarget.blur();
    }
  };

  return (
    <StyledButton
      ref={ref}
      type="button"
      $variant={variant}
      $size={size}
      $block={block}
      $square={square}
      $loading={loading}
      $offset={offset}
      disabled={loading || disabled}
      {...rest}
      onClick={handleClick}
    >
      {loading && <Loader $size={size} />}
      <span className="btn-label">
        {icon}
        {children}
      </span>
    </StyledButton>
  );
});

export default Button;
