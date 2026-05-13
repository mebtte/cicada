import {
  CSSProperties,
  Key,
  ReactNode,
  RefObject,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

const DEFAULT_ESTIMATE_SIZE = 82;

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
  const [scrollMargin, setScrollMargin] = useState(0);
  const externalScrollElement = !!scrollElementRef;
  const virtualizer = useVirtualizer<HTMLElement, HTMLDivElement>({
    count,
    estimateSize: () => estimateSize,
    getItemKey,
    getScrollElement: () => scrollElementRef?.current ?? ownScrollRef.current,
    overscan,
    paddingEnd,
    paddingStart,
    scrollMargin,
    useFlushSync: false,
  });

  useLayoutEffect(() => {
    const rootElement = rootRef.current;
    const scrollElement = scrollElementRef?.current;
    if (!rootElement || !scrollElement) {
      setScrollMargin(0);
      return undefined;
    }

    const updateScrollMargin = () => {
      const rootRect = rootElement.getBoundingClientRect();
      const scrollRect = scrollElement.getBoundingClientRect();
      const nextScrollMargin =
        rootRect.top - scrollRect.top + scrollElement.scrollTop;

      setScrollMargin((current) =>
        Math.abs(current - nextScrollMargin) < 1 ? current : nextScrollMargin,
      );
    };
    const resizeObserver = new ResizeObserver(updateScrollMargin);
    resizeObserver.observe(rootElement);
    resizeObserver.observe(scrollElement);
    updateScrollMargin();
    window.addEventListener('resize', updateScrollMargin);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateScrollMargin);
    };
  }, [count, scrollElementRef]);

  return (
    <div
      ref={(node) => {
        rootRef.current = node;
        if (!externalScrollElement) {
          ownScrollRef.current = node;
        }
      }}
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
