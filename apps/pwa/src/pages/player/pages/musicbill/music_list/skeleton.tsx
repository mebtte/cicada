import { useMemo } from 'react';
import { animated } from 'react-spring';
import styled from 'styled-components';
import getRandomInteger from '#/utils/generate_random_integer';

const Style = styled(animated.div)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: auto;
`;

function Wrapper({ style }: { style: unknown }) {
  const musicList = useMemo(
    () => new Array(getRandomInteger(5, 15)).fill(0),
    [],
  );
  return (
    // @ts-expect-error
    <Style style={style}>{musicList.map(() => null)}</Style>
  );
}

export default Wrapper;
