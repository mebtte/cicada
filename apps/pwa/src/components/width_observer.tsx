import {
  HtmlHTMLAttributes,
  ReactNode,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

function WidthObserver({
  render,
  ...props
}: HtmlHTMLAttributes<HTMLDivElement> & {
  render: (width: number) => ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const resizeObserver = new ResizeObserver((enties: ResizeObserverEntry[]) =>
      setWidth(enties[0].contentRect.width),
    );
    resizeObserver.observe(ref.current!);
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div {...props} ref={ref}>
      {width ? render(width) : null}
    </div>
  );
}

export default WidthObserver;
