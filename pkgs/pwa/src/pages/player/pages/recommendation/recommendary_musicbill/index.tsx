import React, { ReactNode } from 'react';

import ErrorCard from '@/components/error_card';
import Label from '../label';
import { Part } from '../style';
import useData from './use_data';
import ScrollableList from '../scrollable_list';
import Skeleton from './skeleton';
import MusicbillList from './musicbill_list';

const errorCardStyle = {
  flex: 1,
};

const RecommendaryMusicbill = () => {
  const { error, loading, musicbillList, reload } = useData();

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
    content = <MusicbillList musicbillList={musicbillList} />;
  }
  return (
    <Part>
      <Label>推荐歌单</Label>
      <ScrollableList className="list">{content}</ScrollableList>
    </Part>
  );
};

export default RecommendaryMusicbill;
