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
    css: css`
      border-radius: 4px;
    `,
  },
};
const Style = styled.img<{ shape: Shape }>`
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
}: { size?: number; shape?: Shape } & ImgHTMLAttributes<HTMLImageElement>) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const onError = useEvent(() => setCurrentSrc(JpegDefaultCover));

  useEffect(() => {
    setCurrentSrc(src);
  }, [src]);

  return (
    <Style
      loading="lazy"
      {...props}
      src={currentSrc}
      onError={onError}
      style={{
        ...style,
        width: size,
        height: size,
      }}
      shape={shape}
    />
  );
}

export default Cover;
