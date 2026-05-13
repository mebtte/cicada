import { ImgHTMLAttributes, useLayoutEffect, useRef, useState } from 'react';
import styled, { css, keyframes } from 'styled-components';
import { ComponentSize } from '@/constants/style';
import DefaultCover from '@/asset/default_cover.jpeg';
import loadImage, { isImageLoaded } from '@/utils/load_image';
import logger from '@/utils/logger';
import { CSSVariable } from '@/global_style';
import { Shape } from './constants';
import intersectionObserver from './intersection_observer';

const SHAPE_MAP: Record<Shape, { css: ReturnType<typeof css> | null }> = {
  [Shape.ROUNDED]: {
    css: css`
      border-radius: ${CSSVariable.BORDER_RADIUS_NORMAL};
    `,
  },
  [Shape.CIRCLE]: {
    css: css`
      border-radius: 50%;
    `,
  },
  [Shape.SQUARE]: {
    css: null,
  },
};
const Style = styled.div<{ shape: Shape }>`
  position: relative;

  overflow: hidden;
  aspect-ratio: 1;

  ${({ shape }) => {
    const { css: shapeCss } = SHAPE_MAP[shape];
    return shapeCss;
  }}
`;
const fadeIn = keyframes`
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
`;
const Img = styled.img`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;

  object-fit: cover;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  animation: ${fadeIn} 160ms ease-out;
`;
const preventDefault = (e) => e.preventDefault();

function Cover({
  size = ComponentSize.NORMAL,
  shape = Shape.ROUNDED,
  defaultSrc = DefaultCover,
  src,
  style,
  ...props
}: {
  src: string;
  size?: number | string;
  shape?: Shape;
  defaultSrc?: string;
} & ImgHTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null);
  const [currentSrc, setCurrentSrc] = useState(() =>
    src && isImageLoaded(src) ? src : defaultSrc,
  );

  useLayoutEffect(() => {
    if (!src) {
      setCurrentSrc(defaultSrc);
      return;
    }

    if (isImageLoaded(src)) {
      setCurrentSrc(src);
      return;
    }

    setCurrentSrc(defaultSrc);

    let active = true;
    const target = ref.current;
    const load = () =>
      loadImage(src)
        .then(() => {
          if (active) {
            setCurrentSrc(src);
          }
        })
        .catch((error) =>
          logger.error(error, `Failed to load cover "${src}"`),
        );
    const unobserve = intersectionObserver.observe(target, load);
    return () => {
      active = false;
      unobserve();
    };
  }, [src, defaultSrc]);

  return (
    <Style
      style={{
        ...style,
        width: size,
      }}
      shape={shape}
      ref={ref}
      {...props}
    >
      <Img
        key={currentSrc}
        src={currentSrc}
        crossOrigin="anonymous"
        onDragStart={preventDefault}
      />
    </Style>
  );
}

export default Cover;
