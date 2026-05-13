import Spinner from '@/components/spinner';
import { flexCenter } from '@/style/flexbox';
import { RequestStatus } from '@/constants';
import { animated, useTransition } from 'react-spring';
import styled from 'styled-components';
import ErrorCard from '@/components/error_card';
import Empty from '@/components/empty';
import { RefObject, useContext } from 'react';
import VirtualList from '@/components/virtual_list';
import { t } from '@/i18n';
import { FLOATING_CONTROLLER_SCROLL_SPACE, Musicbill } from '../../constants';
import { INFO_HEIGHT } from './constants';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../eventemitter';
import Music from '../../components/music';
import Context from '../../context';

const Style = styled.div`
  position: relative;
  width: 100%;
  min-height: calc(100% - ${INFO_HEIGHT}px - 18px);
`;
const Container = styled(animated.div)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
`;
const StatusContainer = styled(Container)`
  height: 100%;

  ${flexCenter}
`;
const ListContainer = styled(Container)`
  &::after {
    content: '';
    display: block;
    height: ${FLOATING_CONTROLLER_SCROLL_SPACE};
  }
`;

function Wrapper({
  musicbill,
  scrollElementRef,
}: {
  musicbill: Musicbill;
  scrollElementRef: RefObject<HTMLElement | null>;
}) {
  const { playqueue, currentPlayqueuePosition } = useContext(Context);

  const transitions = useTransition(musicbill, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
  });
  return (
    <Style>
      {transitions((style, mb) => {
        if (mb.status === RequestStatus.ERROR) {
          return (
            <StatusContainer style={style}>
              <ErrorCard
                errorMessage={mb.error!.message}
                retry={() =>
                  playerEventemitter.emit(PlayerEventType.RELOAD_MUSICBILL, {
                    id: mb.id,
                    silence: false,
                  })
                }
              />
            </StatusContainer>
          );
        }

        if (mb.status === RequestStatus.SUCCESS) {
          if (mb.musicList.length) {
            return (
              <ListContainer style={style}>
                <VirtualList
                  count={mb.musicList.length}
                  getItemKey={(index) => mb.musicList[index].id}
                  scrollElementRef={scrollElementRef}
                  renderItem={(index, key) => {
                    const music = mb.musicList[index];
                    const active =
                      playqueue[currentPlayqueuePosition]?.id === music.id;
                    return (
                      <Music
                        key={key}
                        index={music.index}
                        music={music}
                        active={active}
                      />
                    );
                  }}
                />
              </ListContainer>
            );
          }
          return (
            <StatusContainer style={style}>
              <Empty description={t('empty_musicbill_warning')} />
            </StatusContainer>
          );
        }

        return (
          <StatusContainer style={style}>
            <Spinner />
          </StatusContainer>
        );
      })}
    </Style>
  );
}

export default Wrapper;
