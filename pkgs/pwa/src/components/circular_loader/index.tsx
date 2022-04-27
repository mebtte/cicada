import React from 'react';
import styled, { css, keyframes } from 'styled-components';

import { ComponentSize } from '@/constants/style';
import Icon, { Name } from '../icon';

const rotate = keyframes`
  0%{
    transform: rotate(0deg);
  } 100% {
    transform: rotate(360deg);
  }
`;

const Style = styled.div`
  display: inline-block;
  position: relative;
  overflow: hidden;
`;
const Circle = styled(Icon)<{
  duration: number;
}>`
  position: absolute;
  top: 0;
  left: 0;
  ${({ duration }) => css`
    animation: ${rotate} ${duration}s linear infinite;
  `}
`;

/**
 * 圆形加载器
 * @author mebtte<hi@mebtte.com>
 */
const CircularLoader = ({
  size = ComponentSize.SMALL,
  style,
  ...props
}: {
  /** 尺寸, 单位 px */
  size?: number;
  style?: React.CSSProperties;
  [key: string]: any;
}) => (
  <Style
    {...props}
    style={{
      width: size,
      height: size,
      ...style,
    }}
  >
    <Circle name={Name.LOADING_OUTLINE} size={size} duration={0.9} />
    <Circle name={Name.LOADING_OUTLINE} size={size} duration={0.6} />
  </Style>
);

export default React.memo(CircularLoader);
