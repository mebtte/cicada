import { memo } from 'react';
import useImage from '@/utils/use_image';
import Avatar from './avatar';
import AnimatedAvatar from './animate_avatar';
import JpegDefaultAvatar from './default_avatar.jpeg';
import { CommonProps, Shape } from './constants';

type Props = Partial<CommonProps> & {
  animated?: boolean;
};

function AvatarWrapper({
  src = JpegDefaultAvatar,
  size = 32,
  shape = Shape.SQUARE,
  animated = false,
  ...props
}: Props) {
  const currentSrc = useImage(src, JpegDefaultAvatar);
  return animated ? (
    <AnimatedAvatar
      {...props}
      src={currentSrc}
      data-src={src}
      size={size}
      shape={shape}
    />
  ) : (
    <Avatar
      {...props}
      src={currentSrc}
      data-src={src}
      size={size}
      shape={shape}
    />
  );
}

export { Shape };
export default memo(AvatarWrapper);
