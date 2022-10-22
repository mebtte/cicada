import styled from 'styled-components';
import Spinner from '#/components/spinner';
import { flexCenter } from '#/style/flexbox';
import Empty from '@/components/empty';
import Pagination from '#/components/pagination';
import { CSSProperties, useLayoutEffect, useRef } from 'react';
import ErrorCard from '@/components/error_card';
import useMusicList from './use_music_list';
import Music from '../../../components/music';
import { PAGE_SIZE } from '../constants';

const Style = styled.div`
  position: relative;

  flex: 1;
  min-height: 0;

  > .content {
    position: absolute;
    width: 100%;
    height: 100%;
    left: 0;
    top: 0;

    &.list {
      overflow: auto;
    }

    &.empty,
    &.error {
      ${flexCenter}
    }

    &.loading {
      ${flexCenter}

      cursor: not-allowed;
      background-color: rgb(255 255 255 / 0.5);
    }
  }
`;
const paginationStyle: CSSProperties = {
  margin: '10px 0',
};

function MusicList() {
  const listRef = useRef<HTMLDivElement>(null);
  const {
    error,
    loading,
    keyword,
    page,
    total,
    musicList,
    onPageChange,
    reload,
  } = useMusicList();

  useLayoutEffect(() => {
    listRef.current?.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, [keyword, page]);

  return (
    <Style>
      {error ? (
        <div className="content error">
          <ErrorCard errorMessage={error.message} retry={reload} />
        </div>
      ) : !loading && !total ? (
        <div className="content empty">
          <Empty description="没有找到合适的音乐" />
        </div>
      ) : (
        <div className="content list" ref={listRef}>
          {musicList.map((music, index) => (
            // eslint-disable-next-line react/no-array-index-key
            <Music key={index} musicWithIndex={music} />
          ))}
          {total ? (
            <Pagination
              style={paginationStyle}
              total={total}
              pageSize={PAGE_SIZE}
              page={page}
              onChange={onPageChange}
            />
          ) : null}
        </div>
      )}
      {loading ? (
        <div className="content loading">
          <Spinner />
        </div>
      ) : null}
    </Style>
  );
}

export default MusicList;
