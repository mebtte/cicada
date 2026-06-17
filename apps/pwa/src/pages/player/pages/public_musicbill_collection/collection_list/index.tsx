import styled from 'styled-components';
import Spinner from '@/components/spinner';
import { flexCenter } from '@/style/flexbox';
import Empty from '@/components/empty';
import Pagination from '@/components/pagination';
import { CSSProperties, useCallback, useEffect, useRef } from 'react';
import ErrorCard from '@/components/error_card';
import useNavigate from '@/utils/use_navigate';
import { Query } from '@/constants';
import { animated, useTransition } from '@react-spring/web';
import absoluteFullSize from '@/style/absolute_full_size';
import Button from '@/components/button';
import { PLAYER_PATH, ROOT_PATH } from '@/constants/route';
import getResizedImage from '@/server/asset/get_resized_image';
import autoScrollbar from '@/style/auto_scrollbar';
import { t } from '@/i18n';
import { CSSVariable } from '@/global_style';
import {
  FLOATING_CONTROLLER_SCROLL_SPACE,
  SearchTab,
} from '../../../constants';
import { PAGE_HORIZONTAL_PADDING } from '../../page';
import useCollectionList from './use_collection_list';
import useInfiniteCollectionList from './use_infinite_collection_list';
import { PAGE_SIZE } from '../constants';
import Musicbill from '../../search/public_musicbill/musicbill';
import { Explore } from '@/components/icon';

const COVER_IMAGE_SIZE = 96;
const MOBILE_BREAKPOINT = 560;

const Style = styled.div<{ $insideDrawer: boolean }>`
  flex: 1;
  min-height: 0;
  height: ${({ $insideDrawer }) => ($insideDrawer ? '100%' : 'auto')};

  position: relative;
`;
const Container = styled(animated.div)`
  ${absoluteFullSize}
`;
const CardContainer = styled(Container)<{ $insideDrawer: boolean }>`
  ${flexCenter}

  padding: ${({ $insideDrawer }) =>
    $insideDrawer ? '18px 18px 24px' : `24px ${PAGE_HORIZONTAL_PADDING}`};

  > .status-panel {
    width: min(560px, 100%);
    padding: 24px 20px;

    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}px) {
    align-items: flex-start;

    > .status-panel {
      padding: 20px 12px;

      > button {
        width: 100%;
      }
    }
  }
`;
const MusicListContainer = styled(Container)<{ $insideDrawer: boolean }>`
  overflow: auto;
  ${autoScrollbar}

  > .content {
    width: 100%;
    padding: ${({ $insideDrawer }) =>
      $insideDrawer ? '18px 18px 0' : `20px ${PAGE_HORIZONTAL_PADDING} 0`};

    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &::after {
    content: '';
    display: block;
    height: ${({ $insideDrawer }) =>
      $insideDrawer ? '16px' : `calc(${FLOATING_CONTROLLER_SCROLL_SPACE} + 24px)`};
  }

  @media (max-width: ${MOBILE_BREAKPOINT}px) {
    > .content {
      padding: ${({ $insideDrawer }) =>
        $insideDrawer ? '18px 14px 0' : `16px ${PAGE_HORIZONTAL_PADDING} 0`};
    }

    &::after {
      height: ${({ $insideDrawer }) =>
        $insideDrawer ? '16px' : `calc(${FLOATING_CONTROLLER_SCROLL_SPACE} + 16px)`};
    }
  }
`;
const paginationStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  margin: '22px 0 0',
  maxWidth: '100%',
  overflowX: 'auto',
  padding: '0 2px 5px',
};
const LoadMoreState = styled.div`
  min-height: 40px;

  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  font-family: 'Nunito', 'Varela Round', system-ui, sans-serif;
  font-size: ${CSSVariable.TEXT_SIZE_SMALL};
  font-weight: 800;
`;

function CollectionMusicbill({ collection }: { collection: {
  id: string;
  cover: string;
  name: string;
  user: { nickname: string };
  musicCount: number;
} }) {
  return (
    <Musicbill
      id={collection.id}
      cover={getResizedImage({
        url: collection.cover,
        size: Math.ceil(COVER_IMAGE_SIZE * window.devicePixelRatio),
      })}
      name={collection.name}
      userNickname={collection.user.nickname}
      musicCount={collection.musicCount}
    />
  );
}

function PagedCollectionList({
  onNavigateToDiscovery,
}: {
  onNavigateToDiscovery?: () => void;
}) {
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
  const navigateToDiscovery = useCallback(
    () => {
      if (onNavigateToDiscovery) {
        onNavigateToDiscovery();
        return;
      }
      navigate({
        path: ROOT_PATH.PLAYER + PLAYER_PATH.EXPLORATION,
        query: {
          [Query.SEARCH_TAB]: SearchTab.PUBLIC_MUSICBILL,
        },
      });
    },
    [navigate, onNavigateToDiscovery],
  );

  const { page, data, reload } = useCollectionList();

  const transitions = useTransition(data, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
  });
  return (
    <Style $insideDrawer={false}>
      {transitions((style, d) => {
        const { error, loading, value } = d;
        if (error) {
          return (
            <CardContainer style={style} $insideDrawer={false}>
              <div className="status-panel">
                <ErrorCard errorMessage={error.message} retry={reload} />
              </div>
            </CardContainer>
          );
        }
        if (loading) {
          return (
            <CardContainer style={style} $insideDrawer={false}>
              <div className="status-panel">
                <Spinner />
              </div>
            </CardContainer>
          );
        }

        if (!value!.total && !value!.collectionList.length) {
          return (
            <CardContainer style={style} $insideDrawer={false}>
              <div className="status-panel">
                <Empty description={t('no_suitable_musicbill')} />
                <Button
                  variant="primary"
                  icon={<Explore />}
                  onClick={navigateToDiscovery}
                >
                  {t('discover_musicbill')}
                </Button>
              </div>
            </CardContainer>
          );
        }

        return (
          <MusicListContainer style={style} $insideDrawer={false}>
            <div className="content">
              {value!.collectionList.map((collection) => (
                <CollectionMusicbill
                  key={collection.id}
                  collection={collection}
                />
              ))}
              {value!.total ? (
                <Pagination
                  style={paginationStyle}
                  count={Math.ceil(value!.total / PAGE_SIZE)}
                  page={page}
                  onChange={onPageChange}
                />
              ) : null}
            </div>
          </MusicListContainer>
        );
      })}
    </Style>
  );
}

function DrawerCollectionList({
  onNavigateToDiscovery,
}: {
  onNavigateToDiscovery?: () => void;
}) {
  const scrollElementRef = useRef<HTMLDivElement | null>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const {
    collectionList,
    total,
    initialLoading,
    loadingMore,
    error,
    loadMoreError,
    hasMore,
    reload,
    loadMore,
    retryLoadMore,
  } = useInfiniteCollectionList();
  const navigateToDiscovery = useCallback(() => {
    if (onNavigateToDiscovery) {
      onNavigateToDiscovery();
      return;
    }
    navigate({
      path: ROOT_PATH.PLAYER + PLAYER_PATH.EXPLORATION,
      query: {
        [Query.SEARCH_TAB]: SearchTab.PUBLIC_MUSICBILL,
      },
    });
  }, [navigate, onNavigateToDiscovery]);

  useEffect(() => {
    const scrollElement = scrollElementRef.current;
    const triggerElement = loadMoreTriggerRef.current;
    if (
      !scrollElement ||
      !triggerElement ||
      initialLoading ||
      loadingMore ||
      loadMoreError ||
      !hasMore
    ) {
      return;
    }

    // 用抽屉滚动容器作为观察根节点，确保窄屏和桌面都只按 drawer 内滚动触发加载。
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          loadMore();
        }
      },
      {
        root: scrollElement,
        rootMargin: '160px 0px',
      },
    );
    observer.observe(triggerElement);
    return () => observer.disconnect();
  }, [hasMore, initialLoading, loadMore, loadingMore, loadMoreError]);

  if (error) {
    return (
      <Style $insideDrawer>
        <CardContainer $insideDrawer>
          <div className="status-panel">
            <ErrorCard errorMessage={error.message} retry={reload} />
          </div>
        </CardContainer>
      </Style>
    );
  }

  if (initialLoading) {
    return (
      <Style $insideDrawer>
        <CardContainer $insideDrawer>
          <div className="status-panel">
            <Spinner />
          </div>
        </CardContainer>
      </Style>
    );
  }

  if (!total && !collectionList.length) {
    return (
      <Style $insideDrawer>
        <CardContainer $insideDrawer>
          <div className="status-panel">
            <Empty description={t('no_suitable_musicbill')} />
            <Button
              variant="primary"
              icon={<Explore />}
              onClick={navigateToDiscovery}
            >
              {t('discover_musicbill')}
            </Button>
          </div>
        </CardContainer>
      </Style>
    );
  }

  return (
    <Style $insideDrawer>
      <MusicListContainer ref={scrollElementRef} $insideDrawer>
        <div className="content">
          {collectionList.map((collection) => (
            <CollectionMusicbill key={collection.id} collection={collection} />
          ))}
          {hasMore || loadingMore || loadMoreError ? (
            <LoadMoreState ref={loadMoreTriggerRef}>
              {loadMoreError ? (
                <Button variant="ghost" size="sm" onClick={retryLoadMore}>
                  {t('retry')}
                </Button>
              ) : loadingMore ? (
                <>
                  <Spinner size={18} />
                  <span>{t('loading')}</span>
                </>
              ) : null}
            </LoadMoreState>
          ) : null}
        </div>
      </MusicListContainer>
    </Style>
  );
}

function CollectionList({
  insideDrawer = false,
  onNavigateToDiscovery,
}: {
  insideDrawer?: boolean;
  onNavigateToDiscovery?: () => void;
}) {
  if (insideDrawer) {
    return (
      <DrawerCollectionList onNavigateToDiscovery={onNavigateToDiscovery} />
    );
  }

  return (
    <PagedCollectionList onNavigateToDiscovery={onNavigateToDiscovery} />
  );
}

export default CollectionList;
