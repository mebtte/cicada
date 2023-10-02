import { ImgHTMLAttributes, useLayoutEffect, useRef, useState } from 'react';
import styled, { css } from 'styled-components';
import { ComponentSize } from '@/constants/style';
import DefaultCover from '@/asset/default_cover.jpeg';
import loadImage from '@/utils/load_image';
import logger from '@/utils/logger';
import { Shape } from './constants';
import intersectionObserver from './intersection_observer';

const SHAPE_MAP: Record<Shape, { css: ReturnType<typeof css> }> = {
  [Shape.CIRCLE]: {
    css: css`
      border-radius: 50%;
    `,
  },
  [Shape.SQUARE]: {
    css: css``,
  },
};
const Style = styled.img<{ shape: Shape }>`
  object-fit: cover;
  aspect-ratio: 1;
  user-select: none;
  -webkit-tap-highlight-color: transparent;

  ${({ shape }) => {
    const { css: shapeCss } = SHAPE_MAP[shape];
    return shapeCss;
  }}
`;
const preventDefault = (e) => e.preventDefault();

function Cover({
  size = ComponentSize.NORMAL,
  shape = Shape.SQUARE,
  src,
  style,
  ...props
}: {
  src: string;
  size?: number | string;
  shape?: Shape;
} & ImgHTMLAttributes<HTMLImageElement>) {
  const ref = useRef<HTMLImageElement>(null);
  const [currentSrc, setCurrentSrc] = useState(DefaultCover);

  useLayoutEffect(() => {
    setCurrentSrc(DefaultCover);

    const unobserve = intersectionObserver.observe(ref.current!, () =>
      loadImage(src)
        .then(() => setCurrentSrc(src))
        .catch((error) => logger.error(error, `Failed to load cover "${src}"`)),
    );
    return unobserve;
  }, [src]);

  return (
    <Style
      ref={ref}
      crossOrigin="anonymous"
      {...props}
      src={currentSrc}
      style={{
        ...style,
        width: size,
      }}
      shape={shape}
      onDragStart={preventDefault}
    />
  );
}

export default Cover;
