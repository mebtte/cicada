import { useMemo } from 'react';
import styled, { css } from 'styled-components';
import { useTransition, animated } from 'react-spring';
import getRandomInteger from '#/utils/generate_random_integer';
import {
  BORDER_RADIUS,
  Shape,
  CommonProps,
  TRANSITION_LIST,
} from './constants';

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
const Img = styled(animated.img)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;

  user-select: none;
`;

function AnimatedAvatar({ src, size, shape, style, ...props }: CommonProps) {
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
    >
      {transitions((imgStyle, s) => (
        <Img src={s} style={imgStyle} crossOrigin="anonymous" />
      ))}
    </Style>
  );
}

export default AnimatedAvatar;
