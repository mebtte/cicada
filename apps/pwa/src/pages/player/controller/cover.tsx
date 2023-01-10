import loadImage from '@/utils/load_image';
import logger from '#/utils/logger';
import getRandomCover from '@/utils/get_random_cover';
import { useEffect, useState } from 'react';
import { animated, useTransition } from 'react-spring';
import styled from 'styled-components';
import { MdUnfoldMore } from 'react-icons/md';
import absoluteFullSize from '@/style/absolute_full_size';
import { flexCenter } from '@/style/flexbox';
import PngDefaultCover from './default_cover.jpeg';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../eventemitter';

const toggleLyric = () =>
  playerEventemitter.emit(PlayerEventType.TOGGLE_LYRIC_PANEL, { open: true });
const Style = styled.div`
  position: relative;

  height: 100%;

  aspect-ratio: 1;
  cursor: pointer;
  overflow: hidden;

  > .expand {
    ${absoluteFullSize}
    ${flexCenter}
    
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

      <div className="expand">
        <MdUnfoldMore />
      </div>
    </Style>
  );
}

export default Wrapper;
