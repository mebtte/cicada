import { ImgHTMLAttributes, useLayoutEffect, useRef, useState } from 'react';
import { animated, useTransition } from '@react-spring/web';
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
type DisplayImage = {
  src: string;
  placeholder: boolean;
};

const displayImageKey = (image: DisplayImage) =>
  `${image.placeholder ? 'placeholder' : 'image'}:${image.src}`;

function Cover({
  size = ComponentSize.NORMAL,
  shape = Shape.ROUNDED,
  src,
  placeholderSrc,
  style,
  ...props
}: {
  src: string;
  placeholderSrc?: string;
  size?: number | string;
  shape?: Shape;
} & ImgHTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null);
  const [currentImage, setCurrentImage] = useState<DisplayImage>(() => {
    if (src && isImageLoaded(src)) {
      return { src, placeholder: false };
    }
    return {
      src: placeholderSrc || DefaultCover,
      placeholder: !!placeholderSrc,
    };
  });

  useLayoutEffect(() => {
    const fallbackSrc = placeholderSrc || DefaultCover;
    const fallbackImage = {
      src: fallbackSrc,
      placeholder: !!placeholderSrc,
    };
    if (!src) {
      setCurrentImage(fallbackImage);
      return;
    }

    if (isImageLoaded(src)) {
      setCurrentImage({ src, placeholder: false });
      return;
    }

    setCurrentImage(fallbackImage);

    let active = true;
    const target = ref.current;
    const load = () =>
      loadImage(src)
        .then(() => {
          if (active) {
            setCurrentImage({ src, placeholder: false });
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
  }, [placeholderSrc, src]);

  const transitions = useTransition(currentImage, {
    keys: displayImageKey,
    from: (image) => ({
      opacity: 0,
      transform: image.placeholder ? 'scale(1.08)' : 'scale(1.035)',
      filter: image.placeholder
        ? 'blur(8px) brightness(1.04) saturate(1.08)'
        : 'brightness(1.08) saturate(1.06)',
    }),
    enter: (image) => ({
      opacity: 1,
      transform: image.placeholder ? 'scale(1.08)' : 'scale(1)',
      filter: image.placeholder
        ? 'blur(8px) brightness(1.04) saturate(1.08)'
        : 'brightness(1) saturate(1)',
    }),
    leave: (image) => ({
      opacity: 0,
      transform: image.placeholder ? 'scale(1.06)' : 'scale(1.02)',
      filter: image.placeholder
        ? 'blur(6px) brightness(0.98) saturate(1.02)'
        : 'brightness(0.98) saturate(0.96)',
    }),
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
      {transitions((transitionStyle, image) => (
        <Img
          style={transitionStyle}
          src={image.src}
          crossOrigin="anonymous"
          onDragStart={preventDefault}
        />
      ))}
    </Style>
  );
}

export default Cover;
