import React, { useState } from 'react';

import { MusicWithIndex } from '../../constants';
import Music from '../../components/music';
import { Container } from './constants';

const MusicList = ({ musicList }: { musicList: MusicWithIndex[] }) => {
  const [topBoxShadow, setTopBoxShadow] = useState(0);
  const onScroll: React.UIEventHandler<HTMLDivElement> = (event) => {
    const { scrollTop } = event.target as HTMLDivElement;
    return setTopBoxShadow(scrollTop === 0 ? 0 : 1);
  };
  return (
    <Container topBoxShadow={topBoxShadow} onScroll={onScroll}>
      {musicList.map((m) => (
        <Music key={m.index} musicWithIndex={m} />
      ))}
    </Container>
  );
};

export default MusicList;
