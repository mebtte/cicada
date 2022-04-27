import React from 'react';
import styled from 'styled-components';
import { useTransition, animated } from 'react-spring';

import ErrorCard from '@/components/error_card';
import Drawer from '@/components/drawer';
import useSinger from './use_singer';
import SingerInfo, { Skeleton as SingerInfoSkeleton } from './singer_info';
import Action from './action';
import MusicList, { Skeleton as MusicListSkeleton } from './music_list';

const Container = styled(animated.div)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
`;
const CardContainer = styled(Container)`
  display: flex;
  align-items: center;
  justify-content: center;
`;
const Content = styled(Container)`
  display: flex;
  flex-direction: column;
  > .bottom {
    flex: 1;
    min-height: 0;

    display: flex;
  }
`;
const bodyProps = {
  style: {
    width: 550,
  },
};

const SingerDrawer = ({
  open,
  onClose,
  id,
}: {
  open: boolean;
  onClose: () => void;
  id: string;
}) => {
  const { data, reload } = useSinger({ id });
  const transitions = useTransition(data, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
  });
  return (
    <Drawer open={open} onClose={onClose} bodyProps={bodyProps}>
      {transitions((style, d) => {
        const { error, loading, singer } = d;
        if (error) {
          return (
            <CardContainer style={style}>
              <ErrorCard errorMessage={error.message} retry={reload} />
            </CardContainer>
          );
        }
        if (loading) {
          return (
            <Content style={style}>
              <SingerInfoSkeleton />
              <div className="bottom">
                <MusicListSkeleton />
              </div>
            </Content>
          );
        }
        return (
          <Content style={style}>
            <SingerInfo singer={singer} />
            <div className="bottom">
              <MusicList musicList={singer.musicList} />
              <Action singer={singer} reload={reload} />
            </div>
          </Content>
        );
      })}
    </Drawer>
  );
};

export default React.memo(SingerDrawer);
