import { useEffect, useState } from 'react';
import { animated, useTransition } from 'react-spring';
import styled from 'styled-components';
import DefaultCover from '@/asset/default_cover.jpeg';
import loadImage from '@/utils/load_image';
import logger from '@/utils/logger';
import { CSSVariable } from '@/global_style';

const Root = styled.div`
  position: relative;

  width: min(70vw, 320px);
  aspect-ratio: 1 / 1;

  border-radius: 24px;
  overflow: hidden;
  background-color: ${CSSVariable.BACKGROUND_COLOR_LEVEL_TWO};
  box-shadow:
    0 24px 60px rgb(0 0 0 / 0.25),
    0 6px 18px rgb(0 0 0 / 0.15);
`;
const Image = styled(animated.div)`
  position: absolute;
  inset: 0;

  background-size: cover;
  background-position: center;
`;

function Cover({ cover }: { cover: string }) {
  const [resolved, setResolved] = useState<string>(DefaultCover);

  useEffect(() => {
    if (!cover) {
      setResolved(DefaultCover);
      return;
    }
    let canceled = false;
    loadImage(cover)
      .then(() => {
        if (!canceled) setResolved(cover);
      })
      .catch((error) => {
        logger.error(error, '加载封面失败');
        if (!canceled) setResolved(DefaultCover);
      });
    return () => {
      canceled = true;
    };
  }, [cover]);

  const transitions = useTransition(resolved, {
    keys: (url: string) => url,
    from: { opacity: 0, transform: 'scale(1.04)' },
    enter: { opacity: 1, transform: 'scale(1)' },
    leave: { opacity: 0, transform: 'scale(0.96)' },
    config: { tension: 220, friction: 28 },
  });

  return (
    <Root>
      {transitions((style, url) => (
        <Image style={{ ...style, backgroundImage: `url(${url})` }} />
      ))}
    </Root>
  );
}

export default Cover;
