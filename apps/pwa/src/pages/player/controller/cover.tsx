import loadImage from '@/utils/load_image';
import logger from '@/utils/logger';
import { HtmlHTMLAttributes, useEffect, useState } from 'react';
import { animated, useTransition } from 'react-spring';
import styled from 'styled-components';
import { MdUnfoldMore } from 'react-icons/md';
import absoluteFullSize from '@/style/absolute_full_size';
import { flexCenter } from '@/style/flexbox';
import { CSS_VAR } from '@/components/theme';
import PngDefaultCover from '@/asset/default_cover.jpeg';

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

const Style = styled.div`
  position: relative;

  height: 100%;

  aspect-ratio: 1;
  overflow: hidden;
  border: 2px solid var(${CSS_VAR.colorPrimaryShadow});
  border-radius: 12px;
  box-shadow: 0 3px 0 var(${CSS_VAR.colorPrimaryShadow});
  background: #fff;

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
`;
const Cover = styled(animated.img)`
  ${absoluteFullSize}

  user-select: none;
  -webkit-tap-highlight-color: transparent;
  object-fit: cover;
  object-position: center;
  will-change: opacity, transform, filter;
`;

function Wrapper({
  cover,
  mask,
  ...props
}: { cover?: string; mask: boolean } & HtmlHTMLAttributes<HTMLDivElement>) {
  const [src, setSrc] = useState(PngDefaultCover);

  useEffect(() => {
    if (cover) {
      let canceled = false;
      loadImage(cover)
        .then(() => {
          if (!canceled) {
            setSrc(cover);
          }
        })
        .catch((error) => {
          logger.error(error, 'Failed to load music cover');
          if (!canceled) {
            setSrc(PngDefaultCover);
          }
        });
      return () => {
        canceled = true;
      };
    }
    setSrc(PngDefaultCover);
  }, [cover]);

  const transitions = useTransition(src, {
    from: {
      opacity: 0,
      transform: 'scale(1.12) translate3d(-3%, 0, 0)',
      filter: 'brightness(1.18) saturate(1.12)',
    },
    enter: {
      opacity: 1,
      transform: 'scale(1.02) translate3d(0%, 0, 0)',
      filter: 'brightness(1) saturate(1)',
    },
    leave: {
      opacity: 0,
      transform: 'scale(1.18) translate3d(3%, 0, 0)',
      filter: 'brightness(0.88) saturate(0.9)',
    },
    config: {
      duration: 720,
      easing: easeOutCubic,
    },
  });
  return (
    <Style {...props}>
      {transitions((style, s) => (
        <Cover style={style} src={s} crossOrigin="anonymous" />
      ))}
      {mask ? (
        <div className="expand">
          <MdUnfoldMore />
        </div>
      ) : null}
    </Style>
  );
}

export default Wrapper;
