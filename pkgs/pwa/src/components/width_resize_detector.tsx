import React, {
  ReactNode,
  useState,
  useRef,
  useImperativeHandle,
  useLayoutEffect,
} from 'react';
import debounce from 'lodash/debounce';

interface Props {
  children: (width: number) => ReactNode;
  style?: React.CSSProperties;
  [key: string]: any;
}

const WidthResizeDetector = React.forwardRef<HTMLDivElement, Props>(
  ({ children, style, ...props }: Props, ref) => {
    const [visible, setVisible] = useState(false);

    const [width, setWidth] = useState(0);
    const innerRef = useRef<HTMLDivElement>();

    useLayoutEffect(() => {
      const resizeObserver = new ResizeObserver(
        debounce((entries: ResizeObserverEntry[]) => {
          setVisible(true);

          const [node] = entries;
          const { width: w } = node.contentRect;
          setWidth(w);
        }, 300),
      );
      resizeObserver.observe(innerRef.current);
      return () => resizeObserver.disconnect();
    }, []);
    useImperativeHandle(ref, () => innerRef.current);

    return (
      <div
        {...props}
        ref={innerRef}
        style={{
          transition: 'all 300ms',
          opacity: visible ? 1 : 0,
          ...style,
        }}
      >
        {children(width)}
      </div>
    );
  },
);

export default WidthResizeDetector;
