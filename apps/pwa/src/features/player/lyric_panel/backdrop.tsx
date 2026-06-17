import logger from '@/utils/logger';
import absoluteFullSize from '@/style/absolute_full_size';
import loadImage from '@/utils/load_image';
import { useEffect, useState } from 'react';
import { animated, useTransition } from 'react-spring';
import styled from 'styled-components';

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

const Style = styled(animated.div)`
  ${absoluteFullSize}

  background-size: cover;
  background-position: center;
  transform-origin: center;
  will-change: opacity, transform, filter;
  mask-image: linear-gradient(
    to bottom,
    #000 0%,
    #000 42%,
    rgb(0 0 0 / 0.45) 74%,
    transparent 100%
  );
  -webkit-mask-image: linear-gradient(
    to bottom,
    #000 0%,
    #000 42%,
    rgb(0 0 0 / 0.45) 74%,
    transparent 100%
  );
`;

function Cover({ cover }: { cover: string }) {
  const [currentCover, setCurrentCover] = useState('');

  useEffect(() => {
    if (cover) {
      let canceled = false;
      loadImage(cover)
        .then(() => {
          if (!canceled) {
            setCurrentCover(cover);
          }
        })
        .catch((error) => {
          logger.error(error, '加载音乐封面失败');
          if (!canceled) {
            setCurrentCover('');
          }
        });
      return () => {
        canceled = true;
      };
    }
    setCurrentCover('');
  }, [cover]);

  const transitions = useTransition(currentCover, {
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
  return transitions((style, c) =>
    c ? <Style style={{ ...style, backgroundImage: `url(${c})` }} /> : null,
  );
}

export default Cover;
