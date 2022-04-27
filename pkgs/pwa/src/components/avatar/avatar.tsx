import React from 'react';
import styled, { css } from 'styled-components';

import { BORDER_RADIUS, Shape, CommonProps } from './constants';

const Style = styled.div<{
  shape: Shape;
}>`
  box-sizing: border-box;
  background-size: cover;
  ${({ shape }) => css`
    border-radius: ${shape === Shape.CIRCLE ? '50%' : `${BORDER_RADIUS}px`};
  `}
`;

/**
 * 头像
 * @author mebtte<hi@mebtte.com>
 */
const Avatar = React.forwardRef<HTMLDivElement, CommonProps>(
  ({ src, size, shape, style, ...props }: CommonProps, ref) => (
    <Style
      {...props}
      shape={shape}
      style={{
        ...style,
        width: size,
        height: size,
        backgroundImage: `url("${src}")`,
      }}
      ref={ref}
    />
  ),
);

export default Avatar;
