import styled, { css } from 'styled-components';
import { BORDER_RADIUS, Shape, CommonProps } from './constants';

const Style = styled.img<{
  shape: Shape;
}>`
  user-select: none;

  ${({ shape }) => css`
    border-radius: ${shape === Shape.CIRCLE ? '50%' : `${BORDER_RADIUS}px`};
  `}
`;

/**
 * 头像
 * @author mebtte<hi@mebtte.com>
 */
function Avatar({ src, size, shape, style, ...props }: CommonProps) {
  return (
    <Style
      {...props}
      src={src}
      crossOrigin="anonymous"
      shape={shape}
      style={{
        ...style,
        width: size,
        height: size,
      }}
    />
  );
}

export default Avatar;
