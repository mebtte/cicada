import React, { useState } from 'react';
import List from 'react-list';

import Empty from '@/components/empty';
import { Musicbill } from '../constants';
import Container from './container';
import Music from '../../../components/music';

const flexCenter = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const MusicList = ({ musicbill }: { musicbill: Musicbill }) => {
  const [topBoxShadow, setTopBoxShadow] = useState(false);

  const { musicList } = musicbill;

  if (!musicList.length) {
    return (
      <Container style={flexCenter}>
        <Empty description="歌单暂无音乐" />
      </Container>
    );
  }

  const onScroll: React.UIEventHandler<HTMLDivElement> = (event) => {
    const { scrollTop } = event.target as HTMLDivElement;
    return setTopBoxShadow(scrollTop !== 0);
  };
  const musicItemRenderer = (index: number, key: string) => (
    <Music key={key} musicWithIndex={musicList[index]} />
  );
  return (
    <Container topBoxShadow={topBoxShadow} onScroll={onScroll}>
      <List
        type="uniform"
        length={musicList.length}
        itemRenderer={musicItemRenderer}
      />
    </Container>
  );
};

export default MusicList;
