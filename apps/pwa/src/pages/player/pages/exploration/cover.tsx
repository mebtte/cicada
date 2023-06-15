import styled from 'styled-components';
import {
  HtmlHTMLAttributes,
  ReactNode,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import loadImage from '@/utils/load_image';
import DefaultCover from '@/asset/default_cover.jpeg';
import absoluteFullSize from '@/style/absolute_full_size';
import asyncQueue from './async_queue';
import intersectionObserver from './intersection_observer';

const Style = styled.div`
  position: relative;

  display: inline-block;

  cursor: pointer;
  overflow: hidden;

  > .content {
    padding-bottom: 100%;

    > .cover {
      ${absoluteFullSize}

      object-fit: cover;
    }

    > .info {
      position: absolute;
      width: 100%;
      bottom: 0;
      left: 0;

      padding: 10px;

      translate: -100%;
      transition: 300ms;
      background-color: rgb(255 255 255 / 0.75);
      backdrop-filter: blur(5px);
    }
  }

  &:hover {
    > .content {
      > .info {
        translate: 0%;
      }
    }
  }
`;

function Wrapper({
  src,
  info,
  ...props
}: HtmlHTMLAttributes<HTMLDivElement> & {
  src: string;
  info: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [currentSrc, setCurrentSrc] = useState('');
  const loadingRef = useRef(false);

  useLayoutEffect(() => {
    if (!currentSrc) {
      const target = ref.current!;
      intersectionObserver.observe(target, (entry) => {
        if (!loadingRef.current && entry.intersectionRatio > 0) {
          asyncQueue
            .run(() => {
              loadingRef.current = true;
              return loadImage(src).finally(() => {
                loadingRef.current = false;
              });
            })
            .then(() => setCurrentSrc(src));
        }
      });
      return () => intersectionObserver.unobserve(target);
    }
  }, [src, currentSrc]);

  return (
    <Style {...props} ref={ref}>
      <div className="content">
        <img
          className="cover"
          src={currentSrc || DefaultCover}
          alt="cover"
          crossOrigin="anonymous"
        />
        <div className="info">{info}</div>
      </div>
    </Style>
  );
}

export default Wrapper;
