/* eslint-disable react/no-unstable-nested-components */
import Spinner from '@/components/spinner';
import { flexCenter } from '@/style/flexbox';
import { animated, useTransition } from 'react-spring';
import styled from 'styled-components';
import ErrorCard from '@/components/error_card';
import WidthObserver from '@/components/width_observer';
import Empty from '@/components/empty';
import absoluteFullSize from '@/style/absolute_full_size';
import { HEADER_HEIGHT } from '../../constants';
import Page from '../page';
import useData from './use_data';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../eventemitter';
import Cover from './cover';

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

    &:emtpy + .emtpy {
      display: flex;
    }
  }

  > .empty {
    display: none;

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
                const itemWidth = `${100 / Math.floor(width / 180)}%`;
                return (
                  <>
                    {d.data.musicList.map((m) => (
                      <Cover
                        key={m.id}
                        src={m.cover}
                        style={{ width: itemWidth }}
                      />
                    ))}
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
