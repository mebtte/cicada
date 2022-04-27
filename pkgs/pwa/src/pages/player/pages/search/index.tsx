import React from 'react';

import Empty from '@/components/empty';
import CircularLoader from '@/components/circular_loader';
import ErrorCard from '@/components/error_card';
import useQuery from '@/utils/use_query';
import {
  SearchType,
  SEARCH_TYPES,
  Query,
  MusicWithIndexAndLrc,
} from './constants';
import useMusicList from './use_music_list';
import MusicList from './music_list';
import CenteredPage from './centered_page';
import LrcMusicList from './lrc_music_list';

const Wrapper = () => {
  const query = useQuery<Query>();
  let searchType = query[Query.SEARCH_TYPE] as SearchType;
  if (!SEARCH_TYPES.includes(searchType)) {
    searchType = SearchType.COMPOSITE;
  }
  const searchValue = query[Query.SEARCH_VALUE] || '';
  const page = (query[Query.PAGE] ? Number(query[Query.PAGE]) : 1) || 1;

  const { error, loading, musicList, total, retry } = useMusicList({
    page,
    searchType,
    searchValue,
  });

  if (error) {
    return (
      <CenteredPage>
        <ErrorCard errorMessage={error.message} retry={retry} />
      </CenteredPage>
    );
  }
  if (loading) {
    return (
      <CenteredPage>
        <CircularLoader />
      </CenteredPage>
    );
  }
  if (!musicList.length) {
    return (
      <CenteredPage>
        <Empty description="未找到相关音乐" />
      </CenteredPage>
    );
  }
  if (searchType === SearchType.COMPOSITE) {
    return <MusicList page={page} musicList={musicList} total={total} />;
  }
  if (searchType === SearchType.LYRIC) {
    return (
      <LrcMusicList
        searchValue={searchValue}
        page={page}
        musicList={musicList as MusicWithIndexAndLrc[]}
        total={total}
      />
    );
  }
  return null;
};

export default Wrapper;
