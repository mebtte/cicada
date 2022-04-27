import React from 'react';

import useImage from '@/utils/use_image';
import Avatar from './avatar';
import AnimatedAvatar from './animate_avatar';
import JpegDefaultAvatar from './default_avatar.jpeg';
import { CommonProps, Shape } from './constants';

type Props = Partial<CommonProps> & {
  animated?: boolean;
};

const Wrapper = React.forwardRef<HTMLDivElement, Props>(
  (
    {
      src = JpegDefaultAvatar,
      size = 32,
      shape = Shape.SQUARE,
      animated = false,
      ...props
    }: Props,
    ref,
  ) => {
    const currentSrc = useImage(src, JpegDefaultAvatar);
    return animated ? (
      <AnimatedAvatar
        {...props}
        src={currentSrc}
        data-src={src}
        size={size}
        shape={shape}
        ref={ref}
      />
    ) : (
      <Avatar
        {...props}
        src={currentSrc}
        data-src={src}
        size={size}
        shape={shape}
        ref={ref}
      />
    );
  },
);

export { Shape };
export default React.memo(Wrapper);
