import React from 'react';
import { useTransition } from 'react-spring';
import styled from 'styled-components';

import MusicInfo from './music_info';
import Skeleton from './skeleton';
import { Music as MusicType } from '../../constants';

const Style = styled.div`
  flex: 1;
  min-width: 0;
  position: relative;
  height: 20px;
  overflow: visible;
`;

const Wrapper = ({ music }: { music?: MusicType }) => {
  const transitions = useTransition(music, {
    from: { opacity: 0, transform: 'translate(0, -150%)' },
    enter: { opacity: 1, transform: 'translate(0, -50%)' },
    leave: { opacity: 0, transform: 'translate(0, 50%)' },
  });
  return (
    <Style>
      {transitions((style, m) =>
        m ? <MusicInfo style={style} music={m} /> : <Skeleton style={style} />,
      )}
    </Style>
  );
};

export default Wrapper;
