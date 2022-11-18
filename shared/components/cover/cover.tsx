import { ImgHTMLAttributes, useEffect, useState } from 'react';
import styled, { css } from 'styled-components';
import { ComponentSize } from '../../constants/style';
import useEvent from '../../utils/use_event';
import JpegDefaultCover from './default_cover.jpeg';
import { Shape } from './constants';

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

  ${({ shape }) => {
    const { css: shapeCss } = SHAPE_MAP[shape];
    return shapeCss;
  }}
`;

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
  const [currentSrc, setCurrentSrc] = useState(src);
  const onError = useEvent(() => setCurrentSrc(JpegDefaultCover));

  useEffect(() => {
    setCurrentSrc(src);
  }, [src]);

  return (
    <Style
      loading="lazy"
      crossOrigin="anonymous"
      {...props}
      src={currentSrc}
      onError={onError}
      style={{
        ...style,
        width: size,
      }}
      shape={shape}
    />
  );
}

export default Cover;
