import Empty from '@/components/empty';
import CircularLoader from '#/components/spinner';
import ErrorCard from '@/components/error_card';
import useQuery from '@/utils/use_query';
import { Query } from './constants';
import useMusicList from './use_music_list';
import MusicList from './music_list';
import CenteredPage from './centered_page';

function Wrapper() {
  const query = useQuery<Query>();
  const searchValue = query[Query.SEARCH_VALUE] || '';
  const page = (query[Query.PAGE] ? Number(query[Query.PAGE]) : 1) || 1;

  const { error, loading, musicList, total, retry } = useMusicList({
    page,
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
  return <MusicList page={page} musicList={musicList} total={total} />;
}

export default Wrapper;
