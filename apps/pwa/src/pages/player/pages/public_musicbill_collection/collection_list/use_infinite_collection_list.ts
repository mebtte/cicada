import { useCallback, useEffect, useRef, useState } from 'react';
import logger from '@/utils/logger';
import getPublicMusicbillCollectionList from '@/server/api/get_public_musicbill_collection_list';
import { Collection, PAGE_SIZE } from '../constants';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../../eventemitter';

function normalizeError(error: unknown) {
  return error instanceof Error ? error : new Error(String(error));
}

function useInfiniteCollectionList() {
  const requestIdRef = useRef(0);
  const [collectionList, setCollectionList] = useState<Collection[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [loadMoreError, setLoadMoreError] = useState<Error | null>(null);

  const loadPage = useCallback(
    async ({ nextPage, append }: { nextPage: number; append: boolean }) => {
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;

      if (append) {
        setLoadingMore(true);
        setLoadMoreError(null);
      } else {
        setInitialLoading(true);
        setLoadingMore(false);
        setError(null);
        setLoadMoreError(null);
      }

      try {
        const data = await getPublicMusicbillCollectionList({
          keyword: '',
          page: nextPage,
          pageSize: PAGE_SIZE,
        });

        if (requestId !== requestIdRef.current) {
          return;
        }

        setTotal(data.total);
        setPage(nextPage);
        setCollectionList((current) => {
          if (!append) {
            return data.collectionList;
          }

          const existingIdSet = new Set(current.map((item) => item.id));
          return [
            ...current,
            ...data.collectionList.filter(
              (item) => !existingIdSet.has(item.id),
            ),
          ];
        });
      } catch (e) {
        const normalizedError = normalizeError(e);
        logger.error(
          normalizedError,
          'Fail to get public musicbill collection list',
        );

        if (requestId !== requestIdRef.current) {
          return;
        }

        if (append) {
          setLoadMoreError(normalizedError);
        } else {
          setError(normalizedError);
        }
      } finally {
        if (requestId !== requestIdRef.current) {
          return;
        }

        if (append) {
          setLoadingMore(false);
        } else {
          setInitialLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [],
  );

  const reload = useCallback(
    () => loadPage({ nextPage: 1, append: false }),
    [loadPage],
  );
  const hasMore = collectionList.length < total;
  const loadMore = useCallback(() => {
    if (initialLoading || loadingMore || loadMoreError || !hasMore) {
      return;
    }

    loadPage({ nextPage: page + 1, append: true });
  }, [
    hasMore,
    initialLoading,
    loadMoreError,
    loadPage,
    loadingMore,
    page,
  ]);
  const retryLoadMore = useCallback(() => {
    if (initialLoading || loadingMore || !hasMore) {
      return;
    }

    loadPage({ nextPage: page + 1, append: true });
  }, [hasMore, initialLoading, loadPage, loadingMore, page]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    const unlistenChange = playerEventemitter.listen(
      PlayerEventType.MUSICBILL_COLLECTION_CHANGE,
      reload,
    );
    return unlistenChange;
  }, [reload]);

  return {
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
  };
}

export default useInfiniteCollectionList;
