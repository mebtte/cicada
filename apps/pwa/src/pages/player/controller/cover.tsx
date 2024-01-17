import loadImage from '@/utils/load_image';
import logger from '@/utils/logger';
import { HtmlHTMLAttributes, useEffect, useState } from 'react';
import { animated, useTransition } from 'react-spring';
import styled from 'styled-components';
import { MdUnfoldMore } from 'react-icons/md';
import absoluteFullSize from '@/style/absolute_full_size';
import { flexCenter } from '@/style/flexbox';
import PngDefaultCover from '@/asset/default_cover.jpeg';

const Style = styled.div`
  position: relative;

  height: 100%;

  aspect-ratio: 1;
  overflow: hidden;

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
    from: { transform: 'translateX(-100%)' },
    enter: { transform: 'translateX(-0%)' },
    leave: { transform: 'translateX(100%)' },
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
