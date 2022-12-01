import loadImage from '#/utils/load_image';
import logger from '#/utils/logger';
import getRandomCover from '@/utils/get_random_cover';
import { useEffect, useState } from 'react';
import { animated, useTransition } from 'react-spring';
import styled from 'styled-components';
import PngDefaultCover from './default_cover.jpeg';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../eventemitter';

const toggleLyric = () =>
  playerEventemitter.emit(PlayerEventType.TOGGEL_LYRIC, null);
const Style = styled.div`
  position: relative;

  height: 100%;

  aspect-ratio: 1;
  cursor: pointer;
  overflow: hidden;
`;
const Cover = styled(animated.img)`
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;

  object-fit: cover;
  object-position: center;
`;

function Wrapper({ cover }: { cover?: string }) {
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
          logger.error(error, '加载音乐封面失败');
          if (!canceled) {
            setSrc(PngDefaultCover);
          }
        });
      return () => {
        canceled = true;
      };
    }
    setSrc(getRandomCover());
  }, [cover]);

  const transitions = useTransition(src, {
    from: { transform: 'translateX(-100%)' },
    enter: { transform: 'translateX(-0%)' },
    leave: { transform: 'translateX(100%)' },
  });
  return (
    <Style onClick={toggleLyric}>
      {transitions((style, s) => (
        <Cover style={style} src={s} crossOrigin="anonymous" />
      ))}
    </Style>
  );
}

export default Wrapper;
