import {
  CSSProperties,
  Key,
  ReactNode,
  RefObject,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import {
  type Rect,
  type Virtualizer,
  useVirtualizer,
} from '@tanstack/react-virtual';

const DEFAULT_ESTIMATE_SIZE = 82;

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
  const update = () => {
    frame = null;
    const { width, height } = element.getBoundingClientRect();
    cb({ width: Math.round(width), height: Math.round(height) });
  };
  const scheduleUpdate = () => {
    if (frame === null) {
      frame = targetWindow.requestAnimationFrame(update);
    }
  };
  const onVisibilityChange = () => {
    if (targetWindow.document.visibilityState === 'visible') {
      scheduleUpdate();
    }
  };

  update();

  const resizeObserver = new targetWindow.ResizeObserver(scheduleUpdate);
  resizeObserver.observe(element);
  targetWindow.addEventListener('resize', scheduleUpdate);
  targetWindow.addEventListener('orientationchange', scheduleUpdate);
  targetWindow.addEventListener('focus', scheduleUpdate);
  targetWindow.addEventListener('pageshow', scheduleUpdate);
  targetWindow.document.addEventListener('visibilitychange', onVisibilityChange);

  return () => {
    if (frame !== null) {
      targetWindow.cancelAnimationFrame(frame);
    }
    resizeObserver.disconnect();
    targetWindow.removeEventListener('resize', scheduleUpdate);
    targetWindow.removeEventListener('orientationchange', scheduleUpdate);
    targetWindow.removeEventListener('focus', scheduleUpdate);
    targetWindow.removeEventListener('pageshow', scheduleUpdate);
    targetWindow.document.removeEventListener(
      'visibilitychange',
      onVisibilityChange,
    );
  };
};

function VirtualList({
  className,
  count,
  estimateSize = DEFAULT_ESTIMATE_SIZE,
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
  getItemKey?: (index: number) => Key;
  overscan?: number;
  paddingEnd?: number;
  paddingStart?: number;
  renderItem: (index: number, key: Key) => ReactNode;
  scrollElementRef?: RefObject<HTMLElement | null>;
  style?: CSSProperties;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const ownScrollRef = useRef<HTMLDivElement | null>(null);
  const [scrollElement, setScrollElement] = useState<HTMLElement | null>(null);
  const [scrollMargin, setScrollMargin] = useState(0);
  const externalScrollElement = !!scrollElementRef;
  const virtualizer = useVirtualizer<HTMLElement, HTMLDivElement>({
    count,
    estimateSize: () => estimateSize,
    getItemKey,
    getScrollElement: () => scrollElement,
    observeElementRect,
    overscan,
    paddingEnd,
    paddingStart,
    scrollMargin,
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
    if (externalScrollElement) {
      updateScrollElement(scrollElementRef.current);
    }
  }, [externalScrollElement, scrollElementRef, updateScrollElement]);

  useLayoutEffect(() => {
    if (!externalScrollElement) {
      updateScrollElement(ownScrollRef.current);
    }
  }, [externalScrollElement, updateScrollElement]);

  useLayoutEffect(() => {
    let frame: number | null = null;
    const rootElement = rootRef.current;
    if (!rootElement || !scrollElement || !externalScrollElement) {
      setScrollMargin(0);
      return undefined;
    }

    const updateScrollMargin = () => {
      frame = null;
      const rootRect = rootElement.getBoundingClientRect();
      const scrollRect = scrollElement.getBoundingClientRect();
      const nextScrollMargin =
        rootRect.top - scrollRect.top + scrollElement.scrollTop;

      setScrollMargin((current) =>
        Math.abs(current - nextScrollMargin) < 1 ? current : nextScrollMargin,
      );
    };
    const scheduleUpdateScrollMargin = () => {
      if (frame === null) {
        frame = window.requestAnimationFrame(updateScrollMargin);
      }
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        scheduleUpdateScrollMargin();
      }
    };

    const resizeObserver = new ResizeObserver(updateScrollMargin);
    resizeObserver.observe(rootElement);
    resizeObserver.observe(scrollElement);
    updateScrollMargin();
    window.addEventListener('resize', scheduleUpdateScrollMargin);
    window.addEventListener('orientationchange', scheduleUpdateScrollMargin);
    window.addEventListener('focus', scheduleUpdateScrollMargin);
    window.addEventListener('pageshow', scheduleUpdateScrollMargin);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      if (frame !== null) {
        window.cancelAnimationFrame(frame);
      }
      resizeObserver.disconnect();
      window.removeEventListener('resize', scheduleUpdateScrollMargin);
      window.removeEventListener(
        'orientationchange',
        scheduleUpdateScrollMargin,
      );
      window.removeEventListener('focus', scheduleUpdateScrollMargin);
      window.removeEventListener('pageshow', scheduleUpdateScrollMargin);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [count, externalScrollElement, scrollElement]);

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
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: virtualItem.size,
              transform: `translateY(${
                virtualItem.start - scrollMargin
              }px)`,
            }}
          >
            {renderItem(virtualItem.index, virtualItem.key)}
          </div>
        ))}
      </div>
    </div>
  );
}

export default VirtualList;
