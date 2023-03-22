import styled from 'styled-components';
import Spinner from '@/components/spinner';
import { flexCenter } from '@/style/flexbox';
import Empty from '@/components/empty';
import Pagination from '@/components/pagination';
import { CSSProperties, useCallback } from 'react';
import ErrorCard from '@/components/error_card';
import useNavigate from '@/utils/use_navigate';
import { Query } from '@/constants';
import { animated, useTransition } from 'react-spring';
import absoluteFullSize from '@/style/absolute_full_size';
import { HEADER_HEIGHT } from '../../../constants';
import useMusicPlayRecordList from './use_music_play_record_list';
import { PAGE_SIZE, TOOLBAR_HEIGHT } from '../constants';
import MusicPlayRecord from './music_play_record';

const Style = styled.div`
  flex: 1;
  min-height: 0;

  position: relative;
`;
const Container = styled(animated.div)`
  ${absoluteFullSize}

  padding-top: ${HEADER_HEIGHT}px;
`;
const CardContainer = styled(Container)`
  ${flexCenter}

  flex-direction: column;
  gap: 20px;
`;
const MusicListContainer = styled(Container)`
  padding-bottom: ${TOOLBAR_HEIGHT}px;

  overflow: auto;
`;
const paginationStyle: CSSProperties = {
  margin: '10px 0',
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

  const { page, data, reload } = useMusicPlayRecordList();

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

        if (!value!.total && !value!.musicPlayRecordList.length) {
          return (
            <CardContainer style={style}>
              <Empty description="暂无相关音乐播放记录" />
            </CardContainer>
          );
        }

        return (
          <MusicListContainer style={style}>
            <div className="list">
              {value!.musicPlayRecordList.map((mpr) => (
                <MusicPlayRecord key={mpr.recordId} musicPlayRecord={mpr} />
              ))}
            </div>
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
