import styled, { keyframes } from 'styled-components';
import { CSSProperties, HTMLAttributes, memo } from 'react';
import { CSSVariable } from '../global_style';
import { ComponentSize } from '../constants/style';

const spin = keyframes`to { transform: rotate(360deg); }`;

const Style = styled.div<{ $color?: CSSProperties['color'] }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: ${({ $color }) => $color ?? CSSVariable.COLOR_PRIMARY};

  &::after {
    content: '';
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    border-radius: 50%;
    border: 2px solid currentColor;
    border-top-color: transparent;
    opacity: 0.8;
    animation: ${spin} 0.55s linear infinite;
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
  return (
    <Style
      {...props}
      $color={color}
      style={{
        width: size,
        height: size,
        ...style,
      }}
    >
    </Style>
  );
}

export default memo(Spinner);
