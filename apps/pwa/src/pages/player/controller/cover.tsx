import loadImage from '@/utils/load_image';
import logger from '@/utils/logger';
import { HtmlHTMLAttributes, useEffect, useState } from 'react';
import { animated, useTransition } from '@react-spring/web';
import styled, { css } from 'styled-components';
import absoluteFullSize from '@/style/absolute_full_size';
import { flexCenter } from '@/style/flexbox';
import { CSS_VAR } from '@/components/theme';
import PngDefaultCover from '@/static/apple-touch-icon_v1.png';
import { CONTROLLER_COVER_SHADOW } from '../constants';
import { Expand } from '@/components/icon';

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

const Style = styled.div<{ $pressable: boolean }>`
  position: relative;

  height: 100%;

  aspect-ratio: 1;
  overflow: hidden;
  border: 2px solid var(${CSS_VAR.colorPrimaryShadow});
  border-radius: 12px;
  box-shadow: 0 ${CONTROLLER_COVER_SHADOW}px 0 var(${CSS_VAR.colorPrimaryShadow});
  background: #fff;
  transition:
    transform 80ms ease,
    box-shadow 80ms ease;

  > .expand {
    ${absoluteFullSize}
    ${flexCenter}

    cursor: pointer;
    opacity: 0;
    transition: 100ms;
    background-color: rgb(0 0 0 / 0.5);
    color: #fff;

    > svg {
      width: 33%;
      height: 33%;
    }
  }

  &:hover {
    > .expand {
      opacity: 1;
    }
  }

  ${({ $pressable }) =>
    $pressable
      ? css`
          cursor: pointer;

          /* 按下时整体下移阴影的距离, 同时抵消阴影, 形成贴合底部的按压反馈 */
          &:active {
            transform: translateY(${CONTROLLER_COVER_SHADOW}px);
            box-shadow: 0 0 0 var(${CSS_VAR.colorPrimaryShadow});
          }
        `
      : null}
`;
const Cover = styled(animated.img)`
  ${absoluteFullSize}

  user-select: none;
  -webkit-tap-highlight-color: transparent;
  object-fit: cover;
  object-position: center;
  will-change: opacity, transform, filter;
`;

type DisplayImage = {
  src: string;
  placeholder: boolean;
};

const displayImageKey = (image: DisplayImage) =>
  `${image.placeholder ? 'placeholder' : 'image'}:${image.src}`;

function Wrapper({
  cover,
  placeholderCover,
  mask,
  ...props
}: {
  cover?: string;
  placeholderCover?: string;
  mask: boolean;
} & HtmlHTMLAttributes<HTMLDivElement>) {
  const [image, setImage] = useState<DisplayImage>(() => ({
    src: placeholderCover || PngDefaultCover,
    placeholder: !!placeholderCover,
  }));

  useEffect(() => {
    const fallback = placeholderCover || PngDefaultCover;
    const fallbackImage = {
      src: fallback,
      placeholder: !!placeholderCover,
    };
    if (cover) {
      setImage(fallbackImage);
      let canceled = false;
      loadImage(cover)
        .then(() => {
          if (!canceled) {
            setImage({ src: cover, placeholder: false });
          }
        })
        .catch((error) => {
          logger.error(error, 'Failed to load music cover');
          if (!canceled) {
            setImage(fallbackImage);
          }
        });
      return () => {
        canceled = true;
      };
    }
    setImage(fallbackImage);
  }, [cover, placeholderCover]);

  const transitions = useTransition(image, {
    keys: displayImageKey,
    from: (item) => ({
      opacity: 0,
      transform: item.placeholder
        ? 'scale(1.14) translate3d(-3%, 0, 0)'
        : 'scale(1.12) translate3d(-3%, 0, 0)',
      filter: item.placeholder
        ? 'blur(8px) brightness(1.08) saturate(1.1)'
        : 'brightness(1.18) saturate(1.12)',
    }),
    enter: (item) => ({
      opacity: 1,
      transform: item.placeholder
        ? 'scale(1.1) translate3d(0%, 0, 0)'
        : 'scale(1.02) translate3d(0%, 0, 0)',
      filter: item.placeholder
        ? 'blur(8px) brightness(1.04) saturate(1.08)'
        : 'brightness(1) saturate(1)',
    }),
    leave: (item) => ({
      opacity: 0,
      transform: item.placeholder
        ? 'scale(1.12) translate3d(3%, 0, 0)'
        : 'scale(1.18) translate3d(3%, 0, 0)',
      filter: item.placeholder
        ? 'blur(6px) brightness(0.96) saturate(1.02)'
        : 'brightness(0.88) saturate(0.9)',
    }),
    config: {
      duration: 720,
      easing: easeOutCubic,
    },
  });
  return (
    <Style {...props} $pressable={mask}>
      {transitions((style, item) => (
        <Cover style={style} src={item.src} crossOrigin="anonymous" />
      ))}
      {mask ? (
        <div className="expand">
          <Expand aria-hidden="true" />
        </div>
      ) : null}
    </Style>
  );
}

export default Wrapper;
