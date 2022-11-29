import Spinner from '#/components/spinner';
import { flexCenter } from '#/style/flexbox';
import { RequestStatus } from '@/constants';
import { animated, useTransition } from 'react-spring';
import styled from 'styled-components';
import ErrorCard from '@/components/error_card';
import List from 'react-list';
import Empty from '@/components/empty';
import { useContext, useEffect, useState } from 'react';
import { Musicbill } from '../../constants';
import { FILTER_HEIGHT, INFO_HEIGHT } from './constants';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../eventemitter';
import Music from '../../components/music';
import Context from '../../context';
import e, { EventType } from './eventemitter';
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

function Wrapper({ musicbill }: { musicbill: Musicbill }) {
  const { id, status, error, musicList } = musicbill;
  const { playqueue, currentPlayqueuePosition } = useContext(Context);

  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    setKeyword('');
  }, [id]);

  useEffect(() => {
    const unlistenKeywordChange = e.listen(EventType.KEYWORD_CHANGE, (data) =>
      setKeyword(data.keyword),
    );
    return unlistenKeywordChange;
  }, []);

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
            const filteredMusicList = musicList.filter((music) =>
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
