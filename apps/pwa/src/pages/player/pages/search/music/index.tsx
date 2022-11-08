import absoluteFullSize from '#/style/absolute_full_size';
import { flexCenter } from '#/style/flexbox';
import { animated, useTransition } from 'react-spring';
import styled from 'styled-components';
import ErrorCard from '@/components/error_card';
import Spinner from '#/components/spinner';
import Empty from '@/components/empty';
import Pagination from '#/components/pagination';
import useNavigate from '#/utils/use_navigate';
import { Query } from '@/constants';
import { CSSProperties } from 'react';
import { PAGE_SIZE, TOOLBAR_HEIGHT } from '../constants';
import useData from './use_data';
import Music from '../../../components/music';

const Container = styled(animated.div)`
  ${absoluteFullSize}
`;
const CardContainer = styled(Container)`
  ${flexCenter}
`;
const MusicContainer = styled(Container)`
  padding-top: ${TOOLBAR_HEIGHT}px;

  overflow: auto;
`;
const paginationStyle: CSSProperties = {
  margin: '20px 0',
};

function Wrapper() {
  const navigate = useNavigate();
  const { data, reload, page } = useData();

  const transitions = useTransition(data, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
  });
  return transitions((style, d) => {
    if (d.error) {
      return (
        <CardContainer style={style}>
          <ErrorCard errorMessage={d.error.message} retry={reload} />
        </CardContainer>
      );
    }
    if (d.loading) {
      return (
        <CardContainer style={style}>
          <Spinner />
        </CardContainer>
      );
    }
    if (!d.value!.total) {
      return (
        <CardContainer style={style}>
          <Empty description="暂无数据" />
        </CardContainer>
      );
    }
    return (
      <MusicContainer style={style}>
        <div className="list">
          {d.value!.musicList.map((music, index) => (
            // eslint-disable-next-line react/no-array-index-key
            <Music key={index} musicWithIndex={music} />
          ))}
        </div>
        {d.value!.total ? (
          <Pagination
            style={paginationStyle}
            page={page}
            pageSize={PAGE_SIZE}
            total={d.value!.total}
            onChange={(p) =>
              navigate({
                query: {
                  [Query.PAGE]: p,
                },
              })
            }
          />
        ) : null}
      </MusicContainer>
    );
  });
}

export default Wrapper;
