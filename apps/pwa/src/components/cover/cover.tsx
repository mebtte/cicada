import { ImgHTMLAttributes, useLayoutEffect, useRef, useState } from 'react';
import styled, { css } from 'styled-components';
import { ComponentSize } from '@/constants/style';
import DefaultCover from '@/asset/default_cover.jpeg';
import loadImage from '@/utils/load_image';
import logger from '@/utils/logger';
import { animated, useTransition } from 'react-spring';
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
const Img = styled(animated.img)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;

  object-fit: cover;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
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
  const [currentSrc, setCurrentSrc] = useState(defaultSrc);

  useLayoutEffect(() => {
    setCurrentSrc(defaultSrc);

    if (src) {
      const unobserve = intersectionObserver.observe(ref.current!, () =>
        loadImage(src)
          .then(() => setCurrentSrc(src))
          .catch((error) =>
            logger.error(error, `Failed to load cover "${src}"`),
          ),
      );
      return unobserve;
    }
  }, [src, defaultSrc]);

  const transitions = useTransition(currentSrc, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
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
      {transitions((innerStyle, s) => (
        <Img
          src={s}
          style={innerStyle}
          crossOrigin="anonymous"
          onDragStart={preventDefault}
        />
      ))}
    </Style>
  );
}

export default Cover;
