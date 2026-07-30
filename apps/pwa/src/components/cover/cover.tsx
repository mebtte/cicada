import { ImgHTMLAttributes, useLayoutEffect, useRef, useState } from 'react';
import { animated, useTransition } from '@react-spring/web';
import styled, { css } from 'styled-components';
import { ComponentSize } from '@/constants/style';
import loadImage, { isImageLoaded } from '@/utils/load_image';
import logger from '@/utils/logger';
import { CSSVariable } from '@/global_style';
import {
  Image as ImageIcon,
  LibraryMusic,
  MusicNote,
  Person,
} from '@/components/icon';
import { CoverFallback, Shape } from './constants';
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
const Fallback = styled(animated.div)`
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;

  color: rgb(38 128 91);
  background:
    radial-gradient(circle at 28% 20%, rgb(255 255 255 / 0.72), transparent 42%),
    linear-gradient(
      145deg,
      ${CSSVariable.BACKGROUND_COLOR_LEVEL_THREE},
      ${CSSVariable.BACKGROUND_DISABLED} 76%
    );
  box-shadow: inset 0 0 0 1px rgb(44 182 125 / 0.06);
  will-change: opacity, transform;

  svg {
    width: 36%;
    height: 36%;
    opacity: 0.26;
  }
`;
const preventDefault = (e) => e.preventDefault();
type DisplayImage =
  | {
      kind: 'image';
      src: string;
      placeholder: boolean;
    }
  | {
      kind: 'fallback';
      variant: CoverFallback;
    };

const displayImageKey = (image: DisplayImage) => {
  if (image.kind === 'fallback') {
    return `fallback:${image.variant}`;
  }
  return `${image.placeholder ? 'placeholder' : 'image'}:${image.src}`;
};

const getFallback = (variant: CoverFallback): DisplayImage => ({
  kind: 'fallback',
  variant,
});

const FALLBACK_ICON_MAP = {
  [CoverFallback.NEUTRAL]: ImageIcon,
  [CoverFallback.MUSIC]: MusicNote,
  [CoverFallback.MUSICBILL]: LibraryMusic,
  [CoverFallback.ARTIST]: Person,
  [CoverFallback.USER]: Person,
};

function Cover({
  size = ComponentSize.NORMAL,
  shape = Shape.ROUNDED,
  fallbackVariant = CoverFallback.NEUTRAL,
  src,
  placeholderSrc,
  style,
  ...props
}: {
  src: string;
  placeholderSrc?: string;
  size?: number | string;
  shape?: Shape;
  fallbackVariant?: CoverFallback;
} & ImgHTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null);
  const [currentImage, setCurrentImage] = useState<DisplayImage>(() => {
    if (src && isImageLoaded(src)) {
      return { kind: 'image', src, placeholder: false };
    }
    return placeholderSrc
      ? { kind: 'image', src: placeholderSrc, placeholder: true }
      : getFallback(fallbackVariant);
  });

  useLayoutEffect(() => {
    const fallbackImage: DisplayImage = placeholderSrc
      ? { kind: 'image', src: placeholderSrc, placeholder: true }
      : getFallback(fallbackVariant);
    if (!src) {
      setCurrentImage(fallbackImage);
      return;
    }

    if (isImageLoaded(src)) {
      setCurrentImage({ kind: 'image', src, placeholder: false });
      return;
    }

    setCurrentImage(fallbackImage);

    let active = true;
    const target = ref.current;
    const load = () =>
      loadImage(src)
        .then(() => {
          if (active) {
            setCurrentImage({ kind: 'image', src, placeholder: false });
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
  }, [fallbackVariant, placeholderSrc, src]);

  const transitions = useTransition(currentImage, {
    keys: displayImageKey,
    from: (image) => ({
      opacity: 0,
      transform:
        image.kind === 'fallback'
          ? 'scale(0.985)'
          : image.placeholder
            ? 'scale(1.08)'
            : 'scale(1.035)',
      filter:
        image.kind === 'fallback'
          ? 'none'
          : image.placeholder
            ? 'blur(8px) brightness(1.04) saturate(1.08)'
            : 'brightness(1.08) saturate(1.06)',
    }),
    enter: (image) => ({
      opacity: 1,
      transform:
        image.kind === 'image' && image.placeholder ? 'scale(1.08)' : 'scale(1)',
      filter:
        image.kind === 'fallback'
          ? 'none'
          : image.placeholder
            ? 'blur(8px) brightness(1.04) saturate(1.08)'
            : 'brightness(1) saturate(1)',
    }),
    leave: (image) => ({
      opacity: 0,
      transform:
        image.kind === 'fallback'
          ? 'scale(1.01)'
          : image.placeholder
            ? 'scale(1.06)'
            : 'scale(1.02)',
      filter:
        image.kind === 'fallback'
          ? 'none'
          : image.placeholder
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
      {transitions((transitionStyle, image) => {
        if (image.kind === 'fallback') {
          const FallbackIcon = FALLBACK_ICON_MAP[image.variant];
          return (
            <Fallback style={transitionStyle}>
              <FallbackIcon aria-hidden="true" />
            </Fallback>
          );
        }
        return (
          <Img
            style={transitionStyle}
            src={image.src}
            crossOrigin="anonymous"
            onDragStart={preventDefault}
            onError={() =>
              setCurrentImage((current) =>
                displayImageKey(current) === displayImageKey(image)
                  ? getFallback(fallbackVariant)
                  : current,
              )
            }
          />
        );
      })}
    </Style>
  );
}

export default Cover;
