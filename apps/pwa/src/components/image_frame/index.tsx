import { HTMLAttributes } from 'react';
import styled, { css } from 'styled-components';
import hover from '@/style/hover';
import Cover, { Shape } from '@/components/cover';

const FACE = '#ffffff';
const DEFAULT_RADIUS_MAX = 18;
const DEFAULT_RADIUS_MIN = 6;
const DEFAULT_RADIUS_RATIO = 0.2;

function formatLength(value: number | string) {
  return typeof value === 'number' ? `${value}px` : value;
}

function getInnerRadius(radius: number, borderWidth: number) {
  return Math.max(0, radius - borderWidth);
}

export function getImageFrameRadius(size: number | string) {
  if (typeof size !== 'number') {
    return DEFAULT_RADIUS_MAX;
  }

  return Math.min(
    Math.max(Math.round(size * DEFAULT_RADIUS_RATIO), DEFAULT_RADIUS_MIN),
    DEFAULT_RADIUS_MAX,
  );
}

const Root = styled.div<{
  $size: number | string;
  $borderWidth: number;
  $borderColor: string;
  $radius: number;
  $shadowColor: string;
  $shadowOffset: number;
  $interactive: boolean;
}>`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: ${({ $size }) => formatLength($size)};
  aspect-ratio: 1;
  box-sizing: border-box;

  border-radius: ${({ $radius }) => `${$radius}px`};
  border: ${({ $borderWidth }) => `${$borderWidth}px`} solid
    ${({ $borderColor }) => $borderColor};
  background: ${FACE};
  box-shadow: 0 ${({ $shadowOffset }) => `${$shadowOffset}px`} 0
    ${({ $shadowColor }) => $shadowColor};
  transition:
    transform 150ms ease-out,
    box-shadow 150ms ease-out,
    border-color 150ms ease-out;
  will-change: transform, box-shadow;

  ${({ $interactive, $shadowOffset, $shadowColor }) =>
    $interactive &&
    css`
      cursor: pointer;
      user-select: none;
      -webkit-tap-highlight-color: transparent;

      ${hover(css`
        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 ${$shadowOffset + 2}px 0 ${$shadowColor};
        }
      `)}

      &:active {
        transform: translateY(${$shadowOffset}px);
        box-shadow: none;
        transition:
          transform 60ms ease-in,
          box-shadow 60ms ease-in;
      }
    `}
`;

const Frame = styled.div<{ $radius: number }>`
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;

  border-radius: ${({ $radius }) => `${$radius}px`};
  background: transparent;
`;

export interface ImageFrameProps extends HTMLAttributes<HTMLDivElement> {
  src: string;
  size?: number | string;
  radius: number;
  borderColor: string;
  shadowColor: string;
  borderWidth?: number;
  shadowOffset?: number;
  placeholderSrc?: string;
}

function ImageFrame({
  src,
  size = 72,
  radius,
  borderColor,
  shadowColor,
  borderWidth = 2,
  shadowOffset = 4,
  placeholderSrc,
  onClick,
  ...props
}: ImageFrameProps) {
  return (
    <Root
      $size={size}
      $borderWidth={borderWidth}
      $borderColor={borderColor}
      $radius={radius}
      $shadowColor={shadowColor}
      $shadowOffset={shadowOffset}
      $interactive={!!onClick}
      onClick={onClick}
      {...props}
    >
      <Frame $radius={getInnerRadius(radius, borderWidth)}>
        <Cover
          src={src}
          size="100%"
          shape={Shape.SQUARE}
          placeholderSrc={placeholderSrc}
        />
      </Frame>
    </Root>
  );
}

export default ImageFrame;
