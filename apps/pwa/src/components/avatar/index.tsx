import { HTMLAttributes } from 'react';
import { CSSVariable } from '@/global_style';
import ImageFrame from '@/components/image_frame';
import { CONTROL_SIZE } from '@/components/control_style';
import { CoverFallback } from '@/components/cover';
import { CSS_VAR } from '../theme';

const PRIMARY = `var(${CSS_VAR.colorPrimary})`;
const PRIMARY_SHADOW = `var(${CSS_VAR.colorPrimaryShadow})`;
const NEUTRAL_SHADOW = CSSVariable.COLOR_NEUTRAL_SHADOW;
const DEFAULT_RADIUS = CONTROL_SIZE.lg.radius;
const SM_RADIUS_MAX = CONTROL_SIZE.sm.height;
const MD_RADIUS_MAX = CONTROL_SIZE.md.height;

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

function getAvatarRadius(size: number | string) {
  if (typeof size !== 'number') {
    return DEFAULT_RADIUS;
  }

  if (size <= SM_RADIUS_MAX) {
    return CONTROL_SIZE.sm.radius;
  }

  if (size <= MD_RADIUS_MAX) {
    return CONTROL_SIZE.md.radius;
  }

  return CONTROL_SIZE.lg.radius;
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
  const radius = getAvatarRadius(size);

  return (
    <ImageFrame
      src={src}
      size={size}
      radius={radius}
      borderWidth={borderWidth}
      borderColor={active ? PRIMARY : NEUTRAL_SHADOW}
      shadowColor={active ? PRIMARY_SHADOW : NEUTRAL_SHADOW}
      shadowOffset={getShadowOffset(size)}
      fallbackVariant={CoverFallback.USER}
      onClick={onClick}
      {...props}
    />
  );
}

export default Avatar;
