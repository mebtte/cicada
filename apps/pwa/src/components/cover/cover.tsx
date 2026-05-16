import { ImgHTMLAttributes, useLayoutEffect, useRef, useState } from 'react';
import { animated, useTransition } from 'react-spring';
import styled, { css } from 'styled-components';
import { ComponentSize } from '@/constants/style';
import DefaultCover from '@/asset/default_cover.jpeg';
import loadImage, { isImageLoaded } from '@/utils/load_image';
import logger from '@/utils/logger';
import { CSSVariable } from '@/global_style';
import { Shape } from './constants';
import intersectionObserver from './intersection_observer';

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

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
const Img = styled(animated.img)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;

  object-fit: cover;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  will-change: opacity, transform, filter;
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

  const transitions = useTransition(currentSrc, {
    from: {
      opacity: 0,
      transform: 'scale(1.035)',
      filter: 'brightness(1.08) saturate(1.06)',
    },
    enter: {
      opacity: 1,
      transform: 'scale(1)',
      filter: 'brightness(1) saturate(1)',
    },
    leave: {
      opacity: 0,
      transform: 'scale(1.02)',
      filter: 'brightness(0.98) saturate(0.96)',
    },
    config: {
      duration: 260,
      easing: easeOutCubic,
    },
  });

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
      {transitions((transitionStyle, imageSrc) => (
        <Img
          style={transitionStyle}
          src={imageSrc}
          crossOrigin="anonymous"
          onDragStart={preventDefault}
        />
      ))}
    </Style>
  );
}

export default Cover;
