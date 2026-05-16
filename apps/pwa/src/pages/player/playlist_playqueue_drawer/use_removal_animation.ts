import { useCallback, useEffect, useRef, useState } from 'react';

export const REMOVAL_ANIMATION_DURATION_MS = 260;
const REMOVAL_ANIMATION_FALLBACK_MS = REMOVAL_ANIMATION_DURATION_MS + 180;

export type RemovalAnimatedItem<T> = {
  item: T;
  key: string;
  leaving: boolean;
};

function useRemovalAnimation<T>(
  items: T[],
  getKey: (item: T) => string,
): {
  finishRemoval: (key: string) => void;
  renderedItems: RemovalAnimatedItem<T>[];
} {
  const timersRef = useRef(new Map<string, number>());
  const [renderedItems, setRenderedItems] = useState<RemovalAnimatedItem<T>[]>(
    () =>
      items.map((item) => ({
        item,
        key: getKey(item),
        leaving: false,
      })),
  );

  const finishRemoval = useCallback((key: string) => {
    const timer = timersRef.current.get(key);
    if (timer) {
      window.clearTimeout(timer);
      timersRef.current.delete(key);
    }

    setRenderedItems((currentItems) =>
      currentItems.filter((item) => item.key !== key),
    );
  }, []);

  useEffect(() => {
    const activeKeys = new Set<string>();
    const nextItems = items.map((item) => {
      const key = getKey(item);
      activeKeys.add(key);
      return {
        item,
        key,
        leaving: false,
      };
    });

    setRenderedItems((previousItems) => {
      const nextRenderedItems = [...nextItems];

      for (const [key, timer] of timersRef.current) {
        if (activeKeys.has(key)) {
          window.clearTimeout(timer);
          timersRef.current.delete(key);
        }
      }

      previousItems.forEach((previousItem, previousIndex) => {
        if (activeKeys.has(previousItem.key)) {
          return;
        }

        const removalItem = {
          ...previousItem,
          leaving: true,
        };
        const insertIndex = Math.min(previousIndex, nextRenderedItems.length);
        nextRenderedItems.splice(insertIndex, 0, removalItem);

        if (!timersRef.current.has(previousItem.key)) {
          const timer = window.setTimeout(() => {
            finishRemoval(previousItem.key);
          }, REMOVAL_ANIMATION_FALLBACK_MS);
          timersRef.current.set(previousItem.key, timer);
        }
      });

      const unchanged =
        previousItems.length === nextRenderedItems.length &&
        previousItems.every((previousItem, index) => {
          const nextItem = nextRenderedItems[index];
          return (
            nextItem &&
            previousItem.key === nextItem.key &&
            previousItem.item === nextItem.item &&
            previousItem.leaving === nextItem.leaving
          );
        });

      return unchanged ? previousItems : nextRenderedItems;
    });
  }, [finishRemoval, getKey, items]);

  useEffect(
    () => () => {
      for (const timer of timersRef.current.values()) {
        window.clearTimeout(timer);
      }
      timersRef.current.clear();
    },
    [],
  );

  return {
    finishRemoval,
    renderedItems,
  };
}

export default useRemovalAnimation;
