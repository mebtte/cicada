import styled from 'styled-components';
import Spinner from '#/components/spinner';
import { flexCenter } from '#/style/flexbox';
import Empty from '@/components/empty';
import Pagination from '#/components/pagination';
import { CSSProperties, useCallback } from 'react';
import ErrorCard from '@/components/error_card';
import { HEADER_HEIGHT } from '@/pages/player/constants';
import useNavigate from '#/utils/use_navigate';
import { Query } from '@/constants';
import { animated, useTransition } from 'react-spring';
import absoluteFullSize from '#/style/absolute_full_size';
import useMusicList from './use_music_list';
import { PAGE_SIZE, TOOLBAR_HEIGHT } from '../constants';
import Music from './music';

const Style = styled.div`
  flex: 1;
  min-height: 0;

  position: relative;
`;
const Container = styled(animated.div)`
  ${absoluteFullSize}
`;
const CardContainer = styled(Container)`
  ${flexCenter}
`;
const MusicListContainer = styled(Container)`
  padding-top: ${HEADER_HEIGHT}px;
  padding-bottom: ${TOOLBAR_HEIGHT}px;

  overflow: auto;
`;
const paginationStyle: CSSProperties = {
  margin: '10px 0',
};
const emptyStyle: CSSProperties = {
  padding: '50px 0',
};

function MusicList() {
  const navigate = useNavigate();
  const onPageChange = useCallback(
    (p: number) =>
      navigate({
        query: {
          [Query.PAGE]: p,
        },
      }),
    [navigate],
  );

  const { page, data, reload } = useMusicList();

  const transitions = useTransition(data, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
  });
  return (
    <Style>
      {transitions((style, d) => {
        const { error, loading, value } = d;
        if (error) {
          return (
            <CardContainer style={style}>
              <ErrorCard errorMessage={error.message} retry={reload} />
            </CardContainer>
          );
        }
        if (loading) {
          return (
            <CardContainer style={style}>
              <Spinner />
            </CardContainer>
          );
        }

        return (
          <MusicListContainer style={style}>
            {value!.musicList.length ? (
              <div className="list">
                {value!.musicList.map((music) => (
                  <Music key={music.id} music={music} />
                ))}
              </div>
            ) : (
              <Empty description="未找到相关数据" style={emptyStyle} />
            )}
            {value!.total ? (
              <Pagination
                style={paginationStyle}
                total={value!.total}
                pageSize={PAGE_SIZE}
                page={page}
                onChange={onPageChange}
              />
            ) : null}
          </MusicListContainer>
        );
      })}
    </Style>
  );
}

export default MusicList;
