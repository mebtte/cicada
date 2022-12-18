import { useContext, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { animated, useTransition } from 'react-spring';
import styled from 'styled-components';
import { HEADER_HEIGHT } from '../../constants';
import Context from '../../context';
import Musicbill from './musicbill';

const MusicbillContainer = styled(animated.div)`
  position: absolute;
  top: ${HEADER_HEIGHT}px;
  left: 0;
  width: 100%;
  height: calc(100% - ${HEADER_HEIGHT}px);
`;

function Wrapper() {
  const { id } = useParams<{ id: string }>();
  const { musicbillList } = useContext(Context);
  const musicbill = useMemo(
    () => musicbillList.find((m) => m.id === id),
    [musicbillList, id],
  );

  const transitions = useTransition(musicbill, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
  });

  return transitions((style, mb) =>
    mb ? (
      <MusicbillContainer style={style}>
        <Musicbill musicbill={mb} />
      </MusicbillContainer>
    ) : null,
  );
}

export default Wrapper;
