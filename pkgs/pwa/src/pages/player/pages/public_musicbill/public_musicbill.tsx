import React from 'react';
import styled from 'styled-components';
import { animated, useTransition } from 'react-spring';

import ErrorCard from '@/components/error_card';
import Page from '../page';
import useData from './use_data';
import { containerStyle } from './constants';
import Top from './top';
import TopSkeleton from './top/skeleton';
import Action from './action';
import MusicListSkeleton from './music_list/skeleton';
import MusicList from './music_list';

const Style = styled(Page)`
  position: relative;
`;
const ErrorCardContainer = styled(animated.div)`
  ${containerStyle}

  display: flex;
  align-items: center;
  justify-content: center;
`;
const Container = styled(animated.div)`
  ${containerStyle}

  display: flex;
  flex-direction: column;

  > .bottom {
    flex: 1;
    min-height: 0;

    display: flex;
  }
`;

const PublicMusicbill = ({ id }: { id: string }) => {
  const { data, reload } = useData(id);
  const transitions = useTransition(data, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
  });

  return (
    <Style>
      {transitions((style, d) => {
        if (d.error) {
          return (
            <ErrorCardContainer style={style}>
              <ErrorCard errorMessage={d.error.message} retry={reload} />
            </ErrorCardContainer>
          );
        }
        if (d.loading) {
          return (
            <Container style={style}>
              <TopSkeleton />
              <div className="bottom">
                <MusicListSkeleton />
              </div>
            </Container>
          );
        }
        return (
          <Container style={style}>
            <Top musicbill={d.musicbill} />
            <div className="bottom">
              <MusicList musicbill={d.musicbill} />
              <Action musicbill={d.musicbill} />
            </div>
          </Container>
        );
      })}
    </Style>
  );
};

export default PublicMusicbill;
