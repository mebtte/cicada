import Spinner from '#/components/spinner';
import { flexCenter } from '#/style/flexbox';
import { RequestStatus } from '@/constants';
import { animated, useTransition } from 'react-spring';
import styled from 'styled-components';
import ErrorCard from '@/components/error_card';
import List from 'react-list';
import mm from '@/global_states/mini_mode';
import { Musicbill } from '../../constants';
import { INFO_HEIGHT } from './constants';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../eventemitter';
import Music from '../../components/music';

const Style = styled.div`
  position: relative;
`;
const Container = styled(animated.div)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
`;
const StatusContainer = styled(Container)`
  height: calc(100% - ${INFO_HEIGHT}px);
  padding: 50px 0;

  ${flexCenter}
`;

function Wrapper({ musicbill }: { musicbill: Musicbill }) {
  const miniMode = mm.useState();

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
          return (
            <Container style={style}>
              <List
                type="uniform"
                length={musicList.length}
                // eslint-disable-next-line react/no-unstable-nested-components
                itemRenderer={(index, key) => (
                  <Music
                    key={key}
                    music={musicList[index]}
                    miniMode={miniMode}
                  />
                )}
              />
            </Container>
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
