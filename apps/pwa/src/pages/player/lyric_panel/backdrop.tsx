import logger from '@/utils/logger';
import absoluteFullSize from '@/style/absolute_full_size';
import loadImage from '@/utils/load_image';
import { useEffect, useState } from 'react';
import { animated, useTransition } from 'react-spring';
import styled from 'styled-components';

const Style = styled(animated.div)`
  ${absoluteFullSize}

  background-size: cover;
  background-position: center;
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
    from: { transform: 'translateX(-100%)' },
    enter: { transform: 'translateX(0%)' },
    leave: { transform: 'translateX(100%)' },
  });
  return transitions((style, c) =>
    c ? <Style style={{ ...style, backgroundImage: `url(${c})` }} /> : null,
  );
}

export default Cover;
