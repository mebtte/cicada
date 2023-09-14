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
import Button, { Variant } from '@/components/button';
import { PLAYER_PATH, ROOT_PATH } from '@/constants/route';
import WidthObserver from '@/components/width_observer';
import getResizedImage from '@/server/asset/get_resized_image';
import autoScrollbar from '@/style/auto_scrollbar';
import { t } from '@/i18n';
import { HEADER_HEIGHT, SearchTab } from '../../../constants';
import useCollectionList from './use_collection_list';
import { PAGE_SIZE, TOOLBAR_HEIGHT } from '../constants';
import PublicMusicbill from '../../../components/public_musicbill';

const ITEM_MIN_WIDTH = 150;
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
  ${autoScrollbar}

  > .list {
    margin: 0 10px;

    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;

    > .item {
      padding: 10px;
    }
  }
`;
const paginationStyle: CSSProperties = {
  margin: '10px 0',
};

function CollectionList() {
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

  const { page, data, reload } = useCollectionList();

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

        if (!value!.total && !value!.collectionList.length) {
          return (
            <CardContainer style={style}>
              <Empty description={t('no_suitable_musicbill')} />
              <Button
                variant={Variant.PRIMARY}
                onClick={() =>
                  navigate({
                    path: ROOT_PATH.PLAYER + PLAYER_PATH.EXPLORATION,
                    query: {
                      [Query.SEARCH_TAB]: SearchTab.PUBLIC_MUSICBILL,
                    },
                  })
                }
              >
                发现乐单
              </Button>
            </CardContainer>
          );
        }

        return (
          <MusicListContainer style={style}>
            <WidthObserver
              className="list"
              render={(width) => {
                const itemWidth = `${
                  100 / Math.floor(width / ITEM_MIN_WIDTH)
                }%`;
                return value!.collectionList.map((c) => (
                  <div key={c.id} className="item" style={{ width: itemWidth }}>
                    <PublicMusicbill
                      id={c.id}
                      cover={getResizedImage({
                        url: c.cover,
                        size: ITEM_MIN_WIDTH * window.devicePixelRatio,
                      })}
                      name={c.name}
                      userId={c.user.id}
                      userNickname={c.user.nickname}
                    />
                  </div>
                ));
              }}
            />
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

export default CollectionList;
