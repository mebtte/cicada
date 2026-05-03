import Cover, { Shape } from '@/components/cover';
import { HTMLAttributes } from 'react';
import styled, { css } from 'styled-components';
import { CSS_VAR } from '../theme';

const PRIMARY = `var(${CSS_VAR.colorPrimary})`;
const PRIMARY_SHADOW = `var(${CSS_VAR.colorPrimaryShadow})`;
const NEUTRAL_SHADOW = 'rgb(180 180 180)';
const FACE = '#ffffff';

function getBorderWidth(size: number | string) {
  return 2;
}

function getRadius(size: number | string) {
  if (typeof size === 'number') {
    return Math.max(14, Math.round(size * 0.24));
  }

  return 20;
}

function getInnerRadius(radius: number, borderWidth: number) {
  return Math.max(0, radius - borderWidth);
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

const Root = styled.div<{
  $size: number | string;
  $borderWidth: number;
  $radius: number;
  $shadowOffset: number;
  $active: boolean;
  $interactive: boolean;
}>`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: ${({ $size }) => (typeof $size === 'number' ? `${$size}px` : $size)};
  aspect-ratio: 1;
  box-sizing: border-box;

  border-radius: ${({ $radius }) => `${$radius}px`};
  border: ${({ $borderWidth }) => `${$borderWidth}px`} solid
    ${({ $active }) => ($active ? PRIMARY : NEUTRAL_SHADOW)};
  background: ${FACE};
  box-shadow: 0 ${({ $shadowOffset }) => `${$shadowOffset}px`} 0
    ${({ $active }) => ($active ? PRIMARY_SHADOW : NEUTRAL_SHADOW)};
  transition:
    transform 150ms ease-out,
    box-shadow 150ms ease-out,
    border-color 150ms ease-out,
    filter 120ms;

  ${({ $interactive, $shadowOffset, $active }) =>
    $interactive &&
    css`
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;

      &:hover {
        filter: brightness(1.06);
      }

      &:active {
        transform: translateY(${$shadowOffset}px);
        box-shadow: none;
        transition:
          transform 60ms ease-in,
          box-shadow 60ms ease-in,
          filter 60ms;
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

const ImageBox = styled.div`
  width: 100%;
  height: 100%;
`;

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
  const borderWidth = getBorderWidth(size);
  const radius = getRadius(size);

  return (
    <Root
      $size={size}
      $borderWidth={borderWidth}
      $radius={radius}
      $shadowOffset={getShadowOffset(size)}
      $active={active}
      $interactive={!!onClick}
      onClick={onClick}
      {...props}
    >
      <Frame $radius={getInnerRadius(radius, borderWidth)}>
        <ImageBox>
          <Cover src={src} size="100%" shape={Shape.SQUARE} />
        </ImageBox>
      </Frame>
    </Root>
  );
}

export default Avatar;
