import React, { ReactNode } from 'react';

import ErrorCard from '@/components/error_card';
import Label from '../label';
import { Part } from '../style';
import useData from './use_data';
import ScrollableList from '../scrollable_list';
import Skeleton from './skeleton';
import SingerList from './singer_list';

const errorCardStyle = {
  flex: 1,
};

const RecommendaryMusic = () => {
  const { error, loading, singerList, reload } = useData();

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
    content = <SingerList singerList={singerList} />;
  }
  return (
    <Part>
      <Label>推荐歌手</Label>
      <ScrollableList className="list">{content}</ScrollableList>
    </Part>
  );
};

export default RecommendaryMusic;
