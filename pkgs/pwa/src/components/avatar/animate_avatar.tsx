import React, { useMemo } from 'react';
import styled, { css } from 'styled-components';
import { useTransition, animated } from 'react-spring';

import {
  BORDER_RADIUS,
  Shape,
  CommonProps,
  TRANSITION_LIST,
} from './constants';
import getRandomInteger from '../../utils/get_random_integer';

const Style = styled.div<{
  shape: Shape;
}>`
  box-sizing: border-box;
  display: inline-block;
  position: relative;
  overflow: hidden;
  ${({ shape }) => css`
    border-radius: ${shape === Shape.CIRCLE ? '50%' : `${BORDER_RADIUS}px`};
  `}
`;
const Img = styled(animated.div)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
`;

const AnimatedAvatar = React.forwardRef<HTMLDivElement, CommonProps>(
  ({ src, size, shape, style, ...props }: CommonProps, ref) => {
    const transtion = useMemo(
      () => TRANSITION_LIST[getRandomInteger(0, TRANSITION_LIST.length)],
      [],
    );
    const transitions = useTransition(src, transtion);
    return (
      <Style
        {...props}
        shape={shape}
        style={{
          ...style,
          width: size,
          height: size,
        }}
        ref={ref}
      >
        {transitions((imgStyle, s) => (
          <Img
            style={{
              ...imgStyle,
              backgroundImage: `url(${s})`,
            }}
          />
        ))}
      </Style>
    );
  },
);

export default AnimatedAvatar;
