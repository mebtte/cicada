import {
  CSSProperties,
  Key,
  ReactNode,
  RefObject,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  type Rect,
  type Virtualizer,
  useVirtualizer,
} from '@tanstack/react-virtual';

const DEFAULT_ESTIMATE_SIZE = 82;
const MEASUREMENT_SETTLE_FRAMES = 12;
const EMPTY_FORCE_RENDER_INDEXES: number[] = [];

export type VirtualListRenderContext = {
  requestMeasure: () => void;
};
type RenderedVirtualItem = {
  index: number;
  key: Key;
  start: number;
};

const getElementRect = (element: HTMLElement): Rect => {
  const rect = element.getBoundingClientRect();
  return {
    width: Math.round(rect.width || element.offsetWidth || element.clientWidth),
    height: Math.round(
      rect.height || element.offsetHeight || element.clientHeight,
    ),
  };
};

const getFallbackRect = (element: HTMLElement, targetWindow: Window): Rect => {
  const rect = getElementRect(element);
  return {
    width: rect.width || targetWindow.innerWidth || 1,
    height:
      rect.height ||
      targetWindow.visualViewport?.height ||
      targetWindow.innerHeight ||
      1,
  };
};

const observeElementRect = (
  instance: Virtualizer<HTMLElement, HTMLDivElement>,
  cb: (rect: Rect) => void,
) => {
  const element = instance.scrollElement;
  const targetWindow = instance.targetWindow;
  if (!element || !targetWindow) {
    return undefined;
  }

  let frame: number | null = null;
  let settleFrame: number | null = null;
  let lastRect: Rect | null = null;
  const update = () => {
    frame = null;
    const rect = getElementRect(element);
    if (rect.height > 0) {
      lastRect = rect;
      cb(rect);
      return;
    }

    cb(lastRect ?? getFallbackRect(element, targetWindow));
  };
  const scheduleUpdate = () => {
    if (frame === null) {
      frame = targetWindow.requestAnimationFrame(update);
    }
  };
  const scheduleSettledUpdates = () => {
    let remainingFrames = MEASUREMENT_SETTLE_FRAMES;
    const tick = () => {
      scheduleUpdate();
      remainingFrames -= 1;
      settleFrame =
        remainingFrames > 0 ? targetWindow.requestAnimationFrame(tick) : null;
    };

    if (settleFrame === null) {
      settleFrame = targetWindow.requestAnimationFrame(tick);
    }
  };
  const onVisibilityChange = () => {
    if (targetWindow.document.visibilityState === 'visible') {
      scheduleSettledUpdates();
    }
  };

  update();
  scheduleSettledUpdates();

  targetWindow.addEventListener('resize', scheduleSettledUpdates);
  targetWindow.addEventListener('orientationchange', scheduleSettledUpdates);
  targetWindow.addEventListener('focus', scheduleSettledUpdates);
  targetWindow.addEventListener('pageshow', scheduleSettledUpdates);
  targetWindow.document.addEventListener('visibilitychange', onVisibilityChange);

  if (!targetWindow.ResizeObserver) {
    return () => {
      if (frame !== null) {
        targetWindow.cancelAnimationFrame(frame);
      }
      if (settleFrame !== null) {
        targetWindow.cancelAnimationFrame(settleFrame);
      }
      targetWindow.removeEventListener('resize', scheduleSettledUpdates);
      targetWindow.removeEventListener(
        'orientationchange',
        scheduleSettledUpdates,
      );
      targetWindow.removeEventListener('focus', scheduleSettledUpdates);
      targetWindow.removeEventListener('pageshow', scheduleSettledUpdates);
      targetWindow.document.removeEventListener(
        'visibilitychange',
        onVisibilityChange,
      );
    };
  }

  const resizeObserver = new targetWindow.ResizeObserver(
    scheduleSettledUpdates,
  );
  resizeObserver.observe(element);

  return () => {
    if (frame !== null) {
      targetWindow.cancelAnimationFrame(frame);
    }
    if (settleFrame !== null) {
      targetWindow.cancelAnimationFrame(settleFrame);
    }
    resizeObserver.disconnect();
    targetWindow.removeEventListener('resize', scheduleSettledUpdates);
    targetWindow.removeEventListener(
      'orientationchange',
      scheduleSettledUpdates,
    );
    targetWindow.removeEventListener('focus', scheduleSettledUpdates);
    targetWindow.removeEventListener('pageshow', scheduleSettledUpdates);
    targetWindow.document.removeEventListener(
      'visibilitychange',
      onVisibilityChange,
    );
  };
};

function VirtualListRow({
  measureFrameMapRef,
  renderItem,
  rowElementMapRef,
  scrollElement,
  scrollMargin,
  virtualItem,
  virtualizer,
}: {
  measureFrameMapRef: { current: Map<Key, number> };
  renderItem: (
    index: number,
    key: Key,
    context: VirtualListRenderContext,
  ) => ReactNode;
  rowElementMapRef: { current: Map<Key, HTMLDivElement> };
  scrollElement: HTMLElement | null;
  scrollMargin: number;
  virtualItem: RenderedVirtualItem;
  virtualizer: Virtualizer<HTMLElement, HTMLDivElement>;
}) {
  const setItemElement = useCallback(
    (node: HTMLDivElement | null) => {
      if (node) {
        rowElementMapRef.current.set(virtualItem.key, node);
      } else {
        rowElementMapRef.current.delete(virtualItem.key);
      }
      virtualizer.measureElement(node);
    },
    [rowElementMapRef, virtualItem.key, virtualizer],
  );
  const requestMeasure = useCallback(() => {
    if (measureFrameMapRef.current.has(virtualItem.key)) {
      return;
    }

    const targetWindow = scrollElement?.ownerDocument.defaultView ?? window;
    const frame = targetWindow.requestAnimationFrame(() => {
      measureFrameMapRef.current.delete(virtualItem.key);
      const itemElement = rowElementMapRef.current.get(virtualItem.key);
      if (itemElement) {
        virtualizer.measureElement(itemElement);
      }
    });
    measureFrameMapRef.current.set(virtualItem.key, frame);
  }, [
    measureFrameMapRef,
    rowElementMapRef,
    scrollElement,
    virtualItem.key,
    virtualizer,
  ]);

  return (
    <div
      ref={setItemElement}
      data-index={virtualItem.index}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        transform: `translateY(${virtualItem.start - scrollMargin}px)`,
      }}
    >
      {renderItem(virtualItem.index, virtualItem.key, {
        requestMeasure,
      })}
    </div>
  );
}

function VirtualList({
  className,
  count,
  estimateSize = DEFAULT_ESTIMATE_SIZE,
  forceRenderIndexes = EMPTY_FORCE_RENDER_INDEXES,
  getItemKey,
  overscan = 8,
  paddingEnd = 0,
  paddingStart = 0,
  renderItem,
  scrollElementRef,
  style,
}: {
  className?: string;
  count: number;
  estimateSize?: number;
  forceRenderIndexes?: number[];
  getItemKey?: (index: number) => Key;
  overscan?: number;
  paddingEnd?: number;
  paddingStart?: number;
  renderItem: (
    index: number,
    key: Key,
    context: VirtualListRenderContext,
  ) => ReactNode;
  scrollElementRef?: RefObject<HTMLElement | null>;
  style?: CSSProperties;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const ownScrollRef = useRef<HTMLDivElement | null>(null);
  const rowElementMapRef = useRef(new Map<Key, HTMLDivElement>());
  const measureFrameMapRef = useRef(new Map<Key, number>());
  const [scrollElement, setScrollElement] = useState<HTMLElement | null>(null);
  const [scrollMargin, setScrollMargin] = useState(0);
  const externalScrollElement = !!scrollElementRef;
  const rangeExtractor = useCallback(
    (range: {
      count: number;
      endIndex: number;
      overscan: number;
      startIndex: number;
    }) => {
      const start = Math.max(range.startIndex - range.overscan, 0);
      const end = Math.min(range.endIndex + range.overscan, range.count - 1);
      const indexes = new Set<number>();

      for (let index = start; index <= end; index += 1) {
        indexes.add(index);
      }

      for (const index of forceRenderIndexes) {
        if (index >= 0 && index < range.count) {
          indexes.add(index);
        }
      }

      return [...indexes].sort((a, b) => a - b);
    },
    [forceRenderIndexes],
  );
  const virtualizer = useVirtualizer<HTMLElement, HTMLDivElement>({
    count,
    estimateSize: () => estimateSize,
    getItemKey,
    getScrollElement: () => scrollElement,
    measureElement: (element, entry, instance) => {
      const rect = element.getBoundingClientRect();
      const size =
        entry?.borderBoxSize?.[0]?.[
          instance.options.horizontal ? 'inlineSize' : 'blockSize'
        ] || (instance.options.horizontal ? rect.width : rect.height);
      return Math.round(size);
    },
    observeElementRect,
    overscan,
    paddingEnd,
    paddingStart,
    rangeExtractor,
    scrollMargin,
    useAnimationFrameWithResizeObserver: true,
    useFlushSync: false,
  });
  const updateScrollElement = useCallback(
    (node: HTMLElement | null) => {
      setScrollElement((current) => (current === node ? current : node));
    },
    [],
  );
  const setRootRef = useCallback(
    (node: HTMLDivElement | null) => {
      rootRef.current = node;
      if (!externalScrollElement) {
        ownScrollRef.current = node;
        updateScrollElement(node);
      }
    },
    [externalScrollElement, updateScrollElement],
  );

  useLayoutEffect(() => {
    if (!externalScrollElement) {
      return undefined;
    }

    let frame: number | null = null;
    let active = true;
    const syncScrollElement = () => {
      if (!active) {
        return;
      }

      const element = scrollElementRef.current;
      updateScrollElement(element);
      if (!element) {
        frame = window.requestAnimationFrame(syncScrollElement);
      }
    };

    syncScrollElement();
    return () => {
      active = false;
      if (frame !== null) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, [externalScrollElement, scrollElementRef, updateScrollElement]);

  useLayoutEffect(() => {
    if (!externalScrollElement) {
      updateScrollElement(ownScrollRef.current);
    }
  }, [externalScrollElement, updateScrollElement]);

  useLayoutEffect(
    () => () => {
      const targetWindow = scrollElement?.ownerDocument.defaultView ?? window;
      for (const frame of measureFrameMapRef.current.values()) {
        targetWindow.cancelAnimationFrame(frame);
      }
      measureFrameMapRef.current.clear();
      rowElementMapRef.current.clear();
    },
    [scrollElement],
  );

  useLayoutEffect(() => {
    let frame: number | null = null;
    let settleFrame: number | null = null;
    const rootElement = rootRef.current;
    if (!rootElement || !scrollElement || !externalScrollElement) {
      setScrollMargin(0);
      return undefined;
    }

    const updateScrollMargin = () => {
      frame = null;
      const rootRect = rootElement.getBoundingClientRect();
      const scrollRect = scrollElement.getBoundingClientRect();
      const nextScrollMargin = Math.max(
        0,
        rootRect.top - scrollRect.top + scrollElement.scrollTop,
      );

      setScrollMargin((current) =>
        Math.abs(current - nextScrollMargin) < 1 ? current : nextScrollMargin,
      );
    };
    const scheduleUpdateScrollMargin = () => {
      if (frame === null) {
        frame = window.requestAnimationFrame(updateScrollMargin);
      }
    };
    const scheduleSettledScrollMarginUpdates = () => {
      let remainingFrames = MEASUREMENT_SETTLE_FRAMES;
      const tick = () => {
        scheduleUpdateScrollMargin();
        remainingFrames -= 1;
        settleFrame =
          remainingFrames > 0 ? window.requestAnimationFrame(tick) : null;
      };

      if (settleFrame === null) {
        settleFrame = window.requestAnimationFrame(tick);
      }
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        scheduleSettledScrollMarginUpdates();
      }
    };

    const resizeObserver = new ResizeObserver(
      scheduleSettledScrollMarginUpdates,
    );
    resizeObserver.observe(rootElement);
    resizeObserver.observe(scrollElement);
    updateScrollMargin();
    scheduleSettledScrollMarginUpdates();
    window.addEventListener('resize', scheduleSettledScrollMarginUpdates);
    window.addEventListener(
      'orientationchange',
      scheduleSettledScrollMarginUpdates,
    );
    window.addEventListener('focus', scheduleSettledScrollMarginUpdates);
    window.addEventListener('pageshow', scheduleSettledScrollMarginUpdates);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      if (frame !== null) {
        window.cancelAnimationFrame(frame);
      }
      if (settleFrame !== null) {
        window.cancelAnimationFrame(settleFrame);
      }
      resizeObserver.disconnect();
      window.removeEventListener('resize', scheduleSettledScrollMarginUpdates);
      window.removeEventListener(
        'orientationchange',
        scheduleSettledScrollMarginUpdates,
      );
      window.removeEventListener('focus', scheduleSettledScrollMarginUpdates);
      window.removeEventListener('pageshow', scheduleSettledScrollMarginUpdates);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [count, externalScrollElement, scrollElement]);

  const virtualItems = virtualizer.getVirtualItems();
  const fallbackVirtualItems = useMemo(
    () =>
      Array.from(
        { length: Math.min(count, Math.max(1, overscan)) },
        (_, index) => ({
          index,
          key: getItemKey?.(index) ?? index,
          size: estimateSize,
          start: paddingStart + index * estimateSize + scrollMargin,
        }),
      ),
    [count, estimateSize, getItemKey, overscan, paddingStart, scrollMargin],
  );
  const renderedVirtualItems: RenderedVirtualItem[] =
    virtualItems.length || !count ? virtualItems : fallbackVirtualItems;

  return (
    <div
      ref={setRootRef}
      className={className}
      style={{
        overflowY: externalScrollElement ? undefined : 'auto',
        ...style,
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: virtualizer.getTotalSize(),
        }}
      >
        {renderedVirtualItems.map((virtualItem) => (
          <VirtualListRow
            key={virtualItem.key}
            measureFrameMapRef={measureFrameMapRef}
            renderItem={renderItem}
            rowElementMapRef={rowElementMapRef}
            scrollElement={scrollElement}
            scrollMargin={scrollMargin}
            virtualItem={virtualItem}
            virtualizer={virtualizer}
          />
        ))}
      </div>
    </div>
  );
}

export default VirtualList;
