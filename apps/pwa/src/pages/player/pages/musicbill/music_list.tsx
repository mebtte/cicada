import Spinner from '#/components/spinner';
import { flexCenter } from '#/style/flexbox';
import { RequestStatus } from '@/constants';
import { animated, useTransition } from 'react-spring';
import styled from 'styled-components';
import ErrorCard from '@/components/error_card';
import List from 'react-list';
import mm from '@/global_states/mini_mode';
import Empty from '@/components/empty';
import { useContext } from 'react';
import { Musicbill } from '../../constants';
import { INFO_HEIGHT } from './constants';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../eventemitter';
import Music from '../../components/music';
import Context from '../../context';

const Style = styled.div`
  position: relative;
  min-height: calc(100% - ${INFO_HEIGHT}px);
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

function Wrapper({ musicbill }: { musicbill: Musicbill }) {
  const miniMode = mm.useState();
  const { playqueue, currentPlayqueuePosition } = useContext(Context);

  const { id, status, error, musicList } = musicbill;

  const transitions = useTransition(status, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
  });
  return (
    <Style>
      {transitions((style, s) => {
        if (s === RequestStatus.ERROR) {
          <StatusContainer style={style}>
            <ErrorCard
              errorMessage={error!.message}
              retry={() =>
                playerEventemitter.emit(PlayerEventType.FETCH_MUSICBILL, { id })
              }
            />
          </StatusContainer>;
        }

        if (s === RequestStatus.SUCCESS) {
          if (musicList.length) {
            return (
              <Container style={style}>
                <List
                  type="uniform"
                  length={musicList.length}
                  // eslint-disable-next-line react/no-unstable-nested-components
                  itemRenderer={(index, key) => {
                    const music = musicList[index];
                    return (
                      <Music
                        key={key}
                        music={music}
                        miniMode={miniMode}
                        active={
                          playqueue[currentPlayqueuePosition]?.id === music.id
                        }
                      />
                    );
                  }}
                />
              </Container>
            );
          }
          return (
            <StatusContainer style={style}>
              <Empty description="乐单暂未收录音乐" />
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
