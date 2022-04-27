import React from 'react';
import { useTransition, animated } from 'react-spring';
import styled from 'styled-components';

import { MusicType } from '@/constants/music';
import Skeleton from '@/components/skeleton';
import Avatar from '@/components/avatar';
import scrollbarAsNeeded from '@/style/scrollbar_as_needed';
import ErrorCard from '@/components/error_card';
import Drawer from '@/components/drawer';
import { COVER_SIZE, PADDING } from './constants';
import useMusic from './use_music';
import eventemitter, { EventType } from '../eventemitter';
import Fork from './fork';
import Action from './action';
import Lyric from './lyric';

const bodyProps = {
  style: {
    width: COVER_SIZE + PADDING * 2,
  },
};
const Container = styled(animated.div)`
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
`;
const CardContainer = styled(Container)`
  display: flex;
  align-items: center;
  justify-content: center;
`;
const Content = styled(Container)`
  overflow: auto;
  ${scrollbarAsNeeded}

  > .content {
    display: flex;
    flex-direction: column;
    gap: 10px;

    padding: ${PADDING}px;

    > .cover {
      align-self: center;
    }

    > .name {
      font-size: 24px;
      font-weight: bold;
      line-height: 1.3;
      color: var(--text-color-primary);
    }

    > .alias {
      font-size: 14px;
      color: var(--text-color-secondary);
      line-height: 1.3;
    }

    > .singers {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 5px;

      font-size: 14px;

      > .singer {
        cursor: pointer;
        color: var(--text-color-primary);
        &:hover {
          color: var(--color-primary);
        }
        &:not(:last-child)::after {
          content: '/';

          display: inline-block;
          color: var(--text-color-secondary);
          margin-left: 5px;
        }
      }
    }
  }
`;

const MusicDrawer = ({
  id,
  open,
  onClose,
}: {
  id: string;
  open: boolean;
  onClose: () => void;
}) => {
  const { data, reload } = useMusic(id);
  const transitions = useTransition(data, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
  });
  return (
    <Drawer open={open} onClose={onClose} bodyProps={bodyProps}>
      {transitions((style, d) => {
        const { error, loading, music } = d;
        if (error) {
          return (
            <CardContainer style={style}>
              <ErrorCard errorMessage={error.message} retry={reload} />
            </CardContainer>
          );
        }
        if (loading) {
          return (
            <Content style={style}>
              <div className="content">
                <Skeleton
                  className="cover"
                  width={COVER_SIZE}
                  height={COVER_SIZE}
                />
                <div className="name">
                  <Skeleton width={150} />
                </div>
                <div className="singers">
                  <Skeleton width={100} />
                </div>
              </div>
            </Content>
          );
        }
        return (
          <Content style={style}>
            <div className="content">
              <Avatar
                className="cover"
                animated
                src={music.cover}
                size={COVER_SIZE}
              />
              <div className="name">{music.name}</div>
              {music.alias ? <div className="alias">{music.alias}</div> : null}
              {music.singers.length ? (
                <div className="singers">
                  {music.singers.map((s) => (
                    <div
                      key={s.id}
                      className="singer"
                      onClick={() =>
                        eventemitter.emit(EventType.OPEN_SINGER_DRAWER, {
                          id: s.id,
                        })
                      }
                    >
                      {s.name}
                    </div>
                  ))}
                </div>
              ) : null}
              <Action music={music} onClose={onClose} />
              <Fork music={music} />
              {music.lrc && music.type === MusicType.NORMAL ? (
                <Lyric lrc={music.lrc} />
              ) : null}
            </div>
          </Content>
        );
      })}
    </Drawer>
  );
};

export default MusicDrawer;
