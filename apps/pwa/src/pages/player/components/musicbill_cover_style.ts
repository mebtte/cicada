import { getImageFrameRadius } from '@/components/image_frame';

export const MUSICBILL_COVER_PUBLIC_COLOR = '#63d1fa';
export const MUSICBILL_COVER_PUBLIC_SHADOW = 'rgb(72 179 220)';

export function getMusicbillCoverRadius(size: number) {
  return getImageFrameRadius(size);
}
