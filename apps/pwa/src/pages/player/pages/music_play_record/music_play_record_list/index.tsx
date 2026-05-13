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
import autoScrollbar from '@/style/auto_scrollbar';
import { t } from '@/i18n';
import { FLOATING_CONTROLLER_SCROLL_SPACE } from '../../../constants';
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
`;
const CardContainer = styled(Container)`
  ${flexCenter}

  flex-direction: column;
  gap: 20px;
`;
const MusicListContainer = styled(Container)`
  overflow: auto;
  ${autoScrollbar}

  > .list {
    padding: 12px 12px 0;
  }

  &::after {
    content: '';
    display: block;
    height: calc(${TOOLBAR_HEIGHT}px + ${FLOATING_CONTROLLER_SCROLL_SPACE});
  }
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
              <Empty description={t('no_suitable_music_play_record')} />
            </CardContainer>
          );
        }

        return (
          <MusicListContainer style={style}>
            <div className="list">
              {value.musicPlayRecordList.map((mpr, index) => (
                <MusicPlayRecord
                  key={mpr.recordId}
                  index={value.total - PAGE_SIZE * (page - 1) - index}
                  musicPlayRecord={mpr}
                />
              ))}
            </div>
            {value!.total ? (
              <Pagination
                style={paginationStyle}
                count={Math.ceil(value!.total / PAGE_SIZE)}
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
