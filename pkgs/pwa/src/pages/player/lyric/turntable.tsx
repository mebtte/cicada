import React from 'react';
import styled, { css, keyframes } from 'styled-components';

import Avatar, { Shape } from '@/components/avatar';

const COVER_SIZE = 360;
const rotate = keyframes`
0% {
  transform: rotate(0deg);
} 100% {
  transform: rotate(360deg);
}
`;
const Style = styled.div<{
  paused: boolean;
}>`
  position: absolute;
  top: calc(50% - ${COVER_SIZE / 2}px);
  left: calc(50% - ${COVER_SIZE / 2}px);

  font-size: 0;
  border-radius: 50%;
  border: 5px solid rgb(155 155 155);
  animation: ${rotate} 48s linear infinite;

  > .cover {
    cursor: pointer;
    border: 30px solid #000;
  }

  ${({ paused }) => css`
    animation-play-state: ${paused ? 'paused' : 'running'};
  `}
`;

const Turntable = ({
  paused,
  cover,
  toggleTurntable,
}: {
  paused: boolean;
  cover: string;
  toggleTurntable: () => void;
}) => (
  <Style paused={paused}>
    <Avatar
      className="cover"
      animated
      src={cover}
      size={COVER_SIZE}
      shape={Shape.CIRCLE}
      onClick={toggleTurntable}
    />
  </Style>
);

export default Turntable;
