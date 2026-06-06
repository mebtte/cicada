import { throttle } from 'lodash-es';
import {
  ForwardedRef,
  forwardRef,
  HtmlHTMLAttributes,
  ReactNode,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

interface Size {
  width: number;
  height: number;
}
const RESIZE_DELAY = 100;

type Props = Omit<HtmlHTMLAttributes<HTMLDivElement>, 'children'> & {
  children: (size: Size) => ReactNode;
};

function SizeObserver(
  { children, ...props }: Props,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const [size, setSize] = useState<Size | null>(null);

  const innerRef = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => innerRef.current!);

  useLayoutEffect(() => {
    const node = innerRef.current!;
    setSize({ width: node.offsetWidth, height: node.offsetHeight });
  }, []);

  useLayoutEffect(() => {
    const resizeObserver = new ResizeObserver(
      throttle(() => {
        const node = innerRef.current;
        if (node) {
          setSize({ width: node.offsetWidth, height: node.offsetHeight });
        }
      }, RESIZE_DELAY),
    );
    resizeObserver.observe(innerRef.current!);
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div {...props} ref={innerRef}>
      {size ? children(size) : null}
    </div>
  );
}

export default forwardRef<HTMLDivElement, Props>(SizeObserver);
