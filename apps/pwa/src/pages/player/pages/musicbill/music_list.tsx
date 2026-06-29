import Spinner from '@/components/spinner';
import { flexCenter } from '@/style/flexbox';
import { RequestStatus } from '@/constants';
import { animated, useTransition } from '@react-spring/web';
import styled from 'styled-components';
import ErrorCard from '@/components/error_card';
import Empty from '@/components/empty';
import { RefObject, useContext, useMemo } from 'react';
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
  const transitionState = useMemo(
    () => ({
      error: musicbill.error,
      id: musicbill.id,
      status: musicbill.status,
      musicList: musicbill.musicList,
    }),
    [musicbill.error, musicbill.id, musicbill.status, musicbill.musicList],
  );

  // 列表数据更新时不能重建整块列表，否则外部滚动容器会被浏览器夹回顶部。
  const transitions = useTransition(transitionState, {
    keys: ({ id, status }) => `${id}:${status}`,
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
  });
  return (
    <Style>
      {transitions((style, state) => {
        if (state.status === RequestStatus.ERROR) {
          return (
            <StatusContainer style={style}>
              <ErrorCard
                errorMessage={state.error!.message}
                retry={() =>
                  playerEventemitter.emit(PlayerEventType.RELOAD_MUSICBILL, {
                    id: state.id,
                    silence: false,
                  })
                }
              />
            </StatusContainer>
          );
        }

        if (state.status === RequestStatus.SUCCESS) {
          if (state.musicList.length) {
            return (
              <ListContainer style={style}>
                <VirtualList
                  count={state.musicList.length}
                  getItemKey={(index) => state.musicList[index].id}
                  scrollElementRef={scrollElementRef}
                  renderItem={(index, key) => {
                    const music = state.musicList[index];
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
