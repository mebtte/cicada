import styled from 'styled-components';
import Spinner from '@/components/spinner';
import { flexCenter } from '@/style/flexbox';
import Empty from '@/components/empty';
import Pagination from '@/components/pagination';
import {
  CSSProperties,
  type ComponentProps,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import ErrorCard from '@/components/error_card';
import useNavigate from '@/utils/use_navigate';
import { Query } from '@/constants';
import { animated, useTransition } from 'react-spring';
import absoluteFullSize from '@/style/absolute_full_size';
import autoScrollbar from '@/style/auto_scrollbar';
import { t } from '@/i18n';
import { FLOATING_CONTROLLER_SCROLL_SPACE } from '../../../constants';
import useMusicPlayRecordList from './use_music_play_record_list';
import { PAGE_SIZE, type MusicPlayRecord as MusicPlayRecordData } from '../constants';
import MusicPlayRecord from './music_play_record';

const Style = styled.div`
  flex: 1;
  min-height: 0;

  position: relative;
`;
const Container = styled(animated.div)`
  ${absoluteFullSize}
`;
type ContainerStyle = ComponentProps<typeof Container>['style'];

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
    height: ${FLOATING_CONTROLLER_SCROLL_SPACE};
  }
`;
const MusicPlayRecordContainer = styled(animated.div)`
  overflow: hidden;
`;
const paginationStyle: CSSProperties = {
  margin: '10px 0',
  display: 'flex',
  justifyContent: 'center',
};

function MusicListContent({
  page,
  data,
  style,
  onPageChange,
}: {
  page: number;
  data: {
    musicPlayRecordList: MusicPlayRecordData[];
    total: number;
  };
  style: ContainerStyle;
  onPageChange: (page: number) => void;
}) {
  const length = data.musicPlayRecordList.length;
  const [showList, setShowList] = useState(length > 0);
  const shouldShowList = length > 0 || showList || data.total > 0;
  const lengthRef = useRef(length);
  const displayIndexRef = useRef<Map<number, number>>(new Map());
  const displayIndexMap = useMemo(
    () =>
      new Map(
        data.musicPlayRecordList.map((mpr, index) => [
          mpr.recordId,
          data.total - PAGE_SIZE * (page - 1) - index,
        ]),
      ),
    [data.musicPlayRecordList, data.total, page],
  );

  useEffect(() => {
    lengthRef.current = length;

    if (length > 0) {
      setShowList(true);
    }

    displayIndexMap.forEach((displayIndex, recordId) => {
      displayIndexRef.current.set(recordId, displayIndex);
    });
  }, [displayIndexMap, length]);

  const transitions = useTransition(data.musicPlayRecordList, {
    keys: (mpr) => mpr.recordId,
    from: {
      maxHeight: 0,
      opacity: 0,
      transform: 'translate3d(36px, 0, 0)',
    },
    enter: {
      maxHeight: 180,
      opacity: 1,
      transform: 'translate3d(0, 0, 0)',
    },
    leave: {
      maxHeight: 0,
      opacity: 0,
      transform: 'translate3d(100%, 0, 0)',
    },
    config: {
      tension: 360,
      friction: 32,
    },
    onDestroyed: (mpr) => {
      displayIndexRef.current.delete(mpr.recordId);

      if (lengthRef.current === 0 && displayIndexRef.current.size === 0) {
        setShowList(false);
      }
    },
  });

  if (!shouldShowList) {
    return (
      <CardContainer style={style}>
        <Empty description={t('no_suitable_music_play_record')} />
      </CardContainer>
    );
  }

  return (
    <MusicListContainer style={style}>
      <div className="list">
        {transitions((itemStyle, mpr, _, index) => (
          <MusicPlayRecordContainer style={itemStyle}>
            <MusicPlayRecord
              index={
                displayIndexMap.get(mpr.recordId) ??
                displayIndexRef.current.get(mpr.recordId) ??
                data.total - PAGE_SIZE * (page - 1) - index
              }
              musicPlayRecord={mpr}
            />
          </MusicPlayRecordContainer>
        ))}
      </div>
      {data.total ? (
        <Pagination
          style={paginationStyle}
          count={Math.ceil(data.total / PAGE_SIZE)}
          page={page}
          onChange={onPageChange}
        />
      ) : null}
    </MusicListContainer>
  );
}

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
    keys: (d) => {
      if (d.error) {
        return 'error';
      }
      if (d.loading) {
        return 'loading';
      }
      return 'value';
    },
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
          <MusicListContent
            data={value!}
            page={page}
            style={style}
            onPageChange={onPageChange}
          />
        );
      })}
    </Style>
  );
}

export default MusicList;
