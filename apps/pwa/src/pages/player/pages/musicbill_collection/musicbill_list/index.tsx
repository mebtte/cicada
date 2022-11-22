import styled from 'styled-components';
import Spinner from '#/components/spinner';
import { flexCenter } from '#/style/flexbox';
import Empty from '@/components/empty';
import Pagination from '#/components/pagination';
import { CSSProperties, useCallback } from 'react';
import ErrorCard from '@/components/error_card';
import useNavigate from '#/utils/use_navigate';
import { Query } from '@/constants';
import { animated, useTransition } from 'react-spring';
import absoluteFullSize from '#/style/absolute_full_size';
import Button, { Variant } from '#/components/button';
import mm from '@/global_states/mini_mode';
import { HEADER_HEIGHT, SearchTab } from '@/pages/player/constants';
import { PLAYER_PATH, ROOT_PATH } from '@/constants/route';
import { CSSVariable } from '#/global_style';
import day from '#/utils/day';
import useMusicbillList from './use_musicbill_list';
import { PAGE_SIZE, TOOLBAR_HEIGHT } from '../constants';
import Musicbill from '../../../components/musicbill';

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

  > .list {
    font-size: 0;
  }
`;
const paginationStyle: CSSProperties = {
  margin: '10px 0',
};
const CollectTime = styled.div`
  margin-top: 5px;

  font-size: 12px;
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
`;

function MusicbillList() {
  const navigate = useNavigate();
  const miniMode = mm.useState();
  const onPageChange = useCallback(
    (p: number) =>
      navigate({
        query: {
          [Query.PAGE]: p,
        },
      }),
    [navigate],
  );

  const { page, data, reload } = useMusicbillList();

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

        if (!value!.total && !value!.musicbillList.length) {
          return (
            <CardContainer style={style}>
              <Empty description="暂未收藏乐单" />
              <Button
                variant={Variant.PRIMARY}
                onClick={() =>
                  navigate({
                    path: ROOT_PATH.PLAYER + PLAYER_PATH.EXPLORE,
                    query: {
                      [Query.SEARCH_TAB]: SearchTab.MUSICBILL,
                    },
                  })
                }
              >
                发现乐单
              </Button>
            </CardContainer>
          );
        }

        const musicbillStyle: CSSProperties = {
          width: miniMode ? '100%' : '50%',
        };
        return (
          <MusicListContainer style={style}>
            <div className="list">
              {value!.musicbillList.map((mb) => (
                <Musicbill
                  key={mb.id}
                  id={mb.id}
                  name={mb.name}
                  cover={mb.cover}
                  musicCount={mb.musicCount}
                  user={mb.user}
                  style={musicbillStyle}
                  addon={
                    <CollectTime>
                      收藏于 {day(mb.collectTimestamp).format('YYYY-MM-DD')}
                    </CollectTime>
                  }
                />
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

export default MusicbillList;
