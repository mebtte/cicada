import styled, { keyframes } from 'styled-components';
import { CSSProperties, HTMLAttributes, memo } from 'react';
import { CSSVariable } from '../global_style';
import { ComponentSize } from '../constants/style';

const beat = keyframes`
  0%, 80%, 100% {
    opacity: 0.55;
    transform: translateY(0) scale(1);
  }

  40% {
    opacity: 1;
    transform: translateY(var(--spinner-lift)) scale(1.16);
  }
`;

const Style = styled.div<{ $color?: CSSProperties['color'] }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spinner-gap);
  color: ${({ $color }) => $color ?? CSSVariable.COLOR_PRIMARY};
  line-height: 0;
  vertical-align: middle;

  > span {
    display: block;
    width: var(--spinner-dot-size);
    height: var(--spinner-dot-size);
    box-sizing: border-box;
    border-radius: 50%;
    border: var(--spinner-border) solid currentColor;
    background: currentColor;
    filter: drop-shadow(0 var(--spinner-shadow) 0 var(--spinner-shadow-color));
    opacity: 0.55;
    transform: translateY(0) scale(1);
    animation: ${beat} 0.9s ease-in-out infinite;
    will-change: opacity, transform;
  }

  > span:nth-child(1) {
    animation-delay: -0.24s;
  }

  > span:nth-child(2) {
    animation-delay: -0.12s;
  }

  @media (prefers-reduced-motion: reduce) {
    > span {
      animation-duration: 1.5s;
    }
  }
`;

/**
 * 加载器
 * @author mebtte<i@mebtte.com>
 */
function Spinner({
  size = ComponentSize.SMALL,
  color,
  style,
  ...props
}: {
  /** 尺寸, 单位 px */
  size?: number;
  /** 颜色, 默认使用 PWA 主题主色。传 currentColor 可继承父级颜色。 */
  color?: CSSProperties['color'];
  style?: CSSProperties;
} & HTMLAttributes<HTMLDivElement>) {
  const dotSize = Math.max(3, Math.round(size * 0.23));
  const gap = Math.max(1, Math.round(size * 0.08));
  const border = size >= 18 ? 2 : 1.5;
  const shadow = Math.min(5, Math.max(1, Math.round(size * 0.1)));
  const travel = Math.max(4, Math.round(size * 0.32));

  return (
    <Style
      {...props}
      $color={color}
      style={{
        '--spinner-dot-size': `${dotSize}px`,
        '--spinner-gap': `${gap}px`,
        '--spinner-border': `${border}px`,
        '--spinner-shadow': `${shadow}px`,
        '--spinner-lift': `${travel * -1}px`,
        '--spinner-travel': `${travel}px`,
        '--spinner-shadow-color': 'color-mix(in srgb, currentColor 70%, #000)',
        width: size,
        height: size,
        ...style,
      } as CSSProperties}
    >
      <span />
      <span />
      <span />
    </Style>
  );
}

export default memo(Spinner);
