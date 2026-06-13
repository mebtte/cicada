import {
  ForwardedRef,
  HTMLAttributes,
  ReactNode,
  forwardRef,
} from 'react';
import styled, { css } from 'styled-components';
import { CSSVariable } from '@/global_style';
import { CSS_VAR } from '../theme';

export type Variant = 'primary' | 'neutral' | 'danger';
export type Size = 'sm' | 'md';

// 与 Button 一致的主题色变量, 保证 server 自定义主色时徽章一并变色
const PRIMARY = `var(${CSS_VAR.colorPrimary})`;
const PRIMARY_SHADOW = `var(${CSS_VAR.colorPrimaryShadow})`;
const NEUTRAL_FACE = 'rgb(247 247 247)';
const NEUTRAL_SHADOW = CSSVariable.COLOR_SURFACE_SHADOW;
const DANGER_FACE = 'rgb(242 80 66)';
const DANGER_SHADOW = 'rgb(190 46 34)';

// 尺寸: 对齐 PWA 内既有徽章 (StatusBadge ~24px, TimeBadge ~26px)
const SIZE_MAP: Record<Size, ReturnType<typeof css>> = {
  sm: css`
    height: 22px;
    padding: 0 8px;
    font-size: 11px;
  `,
  md: css`
    height: 26px;
    padding: 0 10px;
    font-size: 12px;
  `,
};

// 胶囊徽章核心公式: 纯色填充 + 同色描边 + 底部纯色硬阴影 (与 Button 对齐, 无 hover/active 动效)
const makeVariant = (face: string, shadow: string, textColor: string) => css`
  color: ${textColor};
  background: ${face};
  border: 2px solid ${shadow};
  box-shadow: 0 2px 0 ${shadow};
`;

const VARIANT_MAP: Record<Variant, ReturnType<typeof css>> = {
  primary: makeVariant(PRIMARY, PRIMARY_SHADOW, '#fff'),
  neutral: makeVariant(NEUTRAL_FACE, NEUTRAL_SHADOW, CSSVariable.TEXT_COLOR_PRIMARY),
  danger: makeVariant(DANGER_FACE, DANGER_SHADOW, '#fff'),
};

const Root = styled.span<{ $variant: Variant; $size: Size }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  flex: 0 0 auto;
  width: fit-content;
  max-width: 100%;

  border-radius: 999px;
  font-weight: 900;
  line-height: 1;
  white-space: nowrap;
  user-select: none;

  ${({ $size }) => SIZE_MAP[$size]}
  ${({ $variant }) => VARIANT_MAP[$variant]}

  > svg {
    flex: 0 0 auto;
    font-size: 1.2em;
  }
`;

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
}

/**
 * 胶囊徽章 (Tag)
 * 与 Button 共用 Duolingo 式视觉公式: 纯色填充 + 同色硬阴影,
 * 用于状态/角色/类型等只读标签.
 */
function Tag(
  {
    variant = 'primary',
    size = 'sm',
    icon,
    children,
    ...props
  }: TagProps,
  ref: ForwardedRef<HTMLSpanElement>,
) {
  return (
    <Root ref={ref} $variant={variant} $size={size} {...props}>
      {icon}
      {children}
    </Root>
  );
}

export default forwardRef<HTMLSpanElement, TagProps>(Tag);
