/* eslint-disable react/no-unstable-nested-components */
import Spinner from '@/components/spinner';
import { flexCenter } from '@/style/flexbox';
import { animated, useTransition } from 'react-spring';
import styled from 'styled-components';
import ErrorCard from '@/components/error_card';
import WidthObserver from '@/components/width_observer';
import Empty from '@/components/empty';
import absoluteFullSize from '@/style/absolute_full_size';
import getResizedImage from '@/server/asset/get_resized_image';
import { HEADER_HEIGHT } from '../../constants';
import Page from '../page';
import useData from './use_data';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../eventemitter';
import Cover from './cover';
import { ExplorationItemType } from './constants';
import MusicInfo from './music_info';
import SingerInfo from './singer_info';
import PublicMusicbillInfo from './public_musicbill_info';

const ITEM_MIN_WIDTH = 180;
const Root = styled(Page)`
  position: relative;
`;
const Container = styled(animated.div)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;

  padding-top: ${HEADER_HEIGHT}px;
`;
const StatusContainer = styled(Container)`
  ${flexCenter}
`;
const ContentContainer = styled(Container)`
  overflow: auto;

  padding-bottom: env(safe-area-inset-bottom, 0);

  > .content {
    font-size: 0;

    &:empty + .empty {
      visibility: visible;
    }
  }

  > .empty {
    visibility: hidden;

    padding-top: ${HEADER_HEIGHT}px;

    ${absoluteFullSize}
  }
`;

const openMusicDrawer = (id: string) =>
  playerEventemitter.emit(PlayerEventType.OPEN_MUSIC_DRAWER, { id });
const openSingerDrawer = (id: string) =>
  playerEventemitter.emit(PlayerEventType.OPEN_SINGER_DRAWER, { id });
const openMusicbillDrawer = (id: string) =>
  playerEventemitter.emit(PlayerEventType.OPEN_PUBLIC_MUSICBILL_DRAWER, { id });

function Wrapper() {
  const { data, reload } = useData();

  const transitions = useTransition(data, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
  });
  return (
    <Root>
      {transitions((style, d) => {
        if (d.error) {
          return (
            <StatusContainer style={style}>
              <ErrorCard errorMessage={d.error.message} retry={reload} />
            </StatusContainer>
          );
        }
        if (d.loading) {
          return (
            <StatusContainer style={style}>
              <Spinner />
            </StatusContainer>
          );
        }
        return (
          <ContentContainer style={style}>
            <WidthObserver
              className="content"
              render={(width) => {
                const amountOfOneLine = Math.floor(width / ITEM_MIN_WIDTH);
                const itemWidth = `${100 / amountOfOneLine}%`;
                return (
                  <>
                    {d.value
                      .slice(
                        0,
                        d.value.length - (d.value.length % amountOfOneLine),
                      )
                      .map((item) => {
                        switch (item.type) {
                          case ExplorationItemType.MUSIC: {
                            return (
                              <Cover
                                key={item.value.id}
                                src={getResizedImage({
                                  url: item.value.cover,
                                  size: ITEM_MIN_WIDTH * 2,
                                })}
                                style={{ width: itemWidth }}
                                onClick={() => openMusicDrawer(item.value.id)}
                                info={<MusicInfo music={item.value} />}
                              />
                            );
                          }
                          case ExplorationItemType.SINGER: {
                            return (
                              <Cover
                                key={item.value.id}
                                src={getResizedImage({
                                  url: item.value.avatar,
                                  size: ITEM_MIN_WIDTH * 2,
                                })}
                                style={{ width: itemWidth }}
                                onClick={() => openSingerDrawer(item.value.id)}
                                info={<SingerInfo singer={item.value} />}
                              />
                            );
                          }
                          case ExplorationItemType.PUBLIC_MUSICBILL: {
                            return (
                              <Cover
                                key={item.value.id}
                                src={getResizedImage({
                                  url: item.value.cover,
                                  size: ITEM_MIN_WIDTH * 2,
                                })}
                                style={{ width: itemWidth }}
                                onClick={() =>
                                  openMusicbillDrawer(item.value.id)
                                }
                                info={
                                  <PublicMusicbillInfo
                                    publicMusicbill={item.value}
                                  />
                                }
                              />
                            );
                          }
                          default: {
                            return null;
                          }
                        }
                      })}
                  </>
                );
              }}
            />
            <Empty className="empty" description="暂无数据" />
          </ContentContainer>
        );
      })}
    </Root>
  );
}

export default Wrapper;
