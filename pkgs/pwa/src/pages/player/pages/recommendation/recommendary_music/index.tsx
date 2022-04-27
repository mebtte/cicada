import React, { ReactNode } from 'react';

import ErrorCard from '@/components/error_card';
import Label from '../label';
import { Part } from '../style';
import useData from './use_data';
import ScrollableList from '../scrollable_list';
import Skeleton from './skeleton';
import MusicList from './music_list';

const errorCardStyle = {
  flex: 1,
};

const RecommendaryMusic = () => {
  const { error, loading, musicList, reload } = useData();

  let content: ReactNode = null;
  if (error) {
    content = (
      <ErrorCard
        errorMessage={error.message}
        retry={reload}
        style={errorCardStyle}
      />
    );
  } else if (loading) {
    content = <Skeleton />;
  } else {
    content = <MusicList musicList={musicList} />;
  }
  return (
    <Part>
      <Label>推荐音乐</Label>
      <ScrollableList className="list">{content}</ScrollableList>
    </Part>
  );
};

export default RecommendaryMusic;
