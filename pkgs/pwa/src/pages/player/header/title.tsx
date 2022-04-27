import React from 'react';
import styled from 'styled-components';
import { useTransition, animated } from 'react-spring';

import ellipsis from '@/style/ellipsis';

const Style = styled.div`
  flex: 1;
  min-width: 0;
  position: relative;
  margin: 0 20px;
`;
const AnimatedDiv = styled(animated.div)`
  position: absolute;
  width: 100%;
  top: 0;
  left: 0;
  font-size: 20px;
  font-weight: 550;
  user-select: none;
  color: rgb(55 55 55);
  ${ellipsis}
`;

const Title = ({ title }: { title: string }) => {
  const transitions = useTransition(title, {
    from: { opacity: 0, transform: 'translate(0, -215%)' },
    enter: { opacity: 1, transform: 'translate(0, -115%)' },
    leave: { opacity: 0, transform: 'translate(0, -15%)' },
  });
  return (
    <Style>
      {transitions((style, t) => (
        <AnimatedDiv style={style}>{t}</AnimatedDiv>
      ))}
    </Style>
  );
};

export default Title;
