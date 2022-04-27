import React from 'react';
import styled from 'styled-components';
import { animated, useTransition } from 'react-spring';

import useImage from '@/utils/use_image';
import JpegDefaultBackground from './default_background.jpeg';

const Style = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  > .child {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
  > .cover {
    background-size: cover;
    background-position: center;
  }
  > .mask {
    backdrop-filter: blur(30px);
  }
`;

const Background = ({ cover }: { cover: string }) => {
  const src = useImage(cover, JpegDefaultBackground);
  const transitions = useTransition(src, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
  });
  return (
    <Style>
      {transitions(({ opacity }, s) => (
        <animated.div
          className="child cover"
          style={{
            opacity,
            backgroundImage: `url(${s})`,
          }}
        />
      ))}
      <div className="child mask" />
    </Style>
  );
};

export default Background;
