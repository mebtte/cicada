import Spinner from '@/components/spinner';
import { flexCenter } from '@/style/flexbox';
import { RequestStatus } from '@/constants';
import { animated, useTransition } from 'react-spring';
import styled from 'styled-components';
import ErrorCard from '@/components/error_card';
import List from 'react-list';
import Empty from '@/components/empty';
import { useContext } from 'react';
import { Musicbill } from '../../constants';
import { FILTER_HEIGHT, INFO_HEIGHT } from './constants';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../eventemitter';
import Music from '../../components/music';
import Context from '../../context';
import { filterMusic } from '../../utils';

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
const ListContainer = styled(Container)`
  padding-bottom: ${FILTER_HEIGHT}px;
`;

function Wrapper({
  keyword,
  musicbill,
}: {
  keyword: string;
  musicbill: Musicbill;
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
            const filteredMusicList = mb.musicList.filter((music) =>
              filterMusic(music, keyword),
            );
            if (filteredMusicList.length) {
              return (
                <ListContainer style={style}>
                  <List
                    type="uniform"
                    length={filteredMusicList.length}
                    // eslint-disable-next-line react/no-unstable-nested-components
                    itemRenderer={(index, key) => {
                      const music = filteredMusicList[index];
                      return (
                        <Music
                          key={key}
                          music={music}
                          active={
                            playqueue[currentPlayqueuePosition]?.id === music.id
                          }
                        />
                      );
                    }}
                  />
                </ListContainer>
              );
            }
            return (
              <StatusContainer style={style}>
                <Empty description="未找到相关音乐" />
              </StatusContainer>
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
