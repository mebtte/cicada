import React from 'react';
import styled from 'styled-components';
import { useTransition } from 'react-spring';

import { Musicbill } from '../../../constants';
import useState from './use_state';
import { Status } from './constants';
import ErrorDisplay from './error_display';
import Skeleton from './skeleton';
import Empty from './empty';
import MusicList from './music_list';
import useKeyword from './use_keyword';

const Style = styled.div`
  flex: 1;
  min-width: 0;
  position: relative;
`;

const Wrapper = ({ musicbill }: { musicbill: Musicbill }) => {
  const keyword = useKeyword();
  const state = useState(musicbill, keyword);
  const transitions = useTransition(state, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
  });
  return (
    <Style>
      {transitions((style, s) => {
        if (s.status === Status.SUCCESS) {
          return (
            <MusicList
              style={style}
              id={musicbill.id}
              musicList={s.musicList}
            />
          );
        }
        if (s.status === Status.EMPTY) {
          return <Empty keyword={keyword} style={style} />;
        }
        if (s.status === Status.LOADING) {
          return <Skeleton style={style} />;
        }
        if (s.status === Status.ERROR) {
          return (
            <ErrorDisplay style={style} id={musicbill.id} error={s.error} />
          );
        }
        return null;
      })}
    </Style>
  );
};

export default Wrapper;
