import { HTMLAttributes } from 'react';
import { CSSVariable } from '@/global_style';
import ImageFrame, { getImageFrameRadius } from '@/components/image_frame';
import { CSS_VAR } from '../theme';

const PRIMARY = `var(${CSS_VAR.colorPrimary})`;
const PRIMARY_SHADOW = `var(${CSS_VAR.colorPrimaryShadow})`;
const NEUTRAL_SHADOW = CSSVariable.COLOR_NEUTRAL_SHADOW;

function getBorderWidth() {
  return 2;
}

function getShadowOffset(size: number | string) {
  if (typeof size === 'number') {
    if (size <= 40) {
      return 3;
    }
    if (size <= 88) {
      return 4;
    }
    return 5;
  }

  return 4;
}

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src: string;
  size?: number | string;
  active?: boolean;
}

function Avatar({
  src,
  size = 72,
  active = false,
  onClick,
  ...props
}: AvatarProps) {
  const borderWidth = getBorderWidth();
  const radius = getImageFrameRadius(size);

  return (
    <ImageFrame
      src={src}
      size={size}
      radius={radius}
      borderWidth={borderWidth}
      borderColor={active ? PRIMARY : NEUTRAL_SHADOW}
      shadowColor={active ? PRIMARY_SHADOW : NEUTRAL_SHADOW}
      shadowOffset={getShadowOffset(size)}
      onClick={onClick}
      {...props}
    />
  );
}

export default Avatar;
