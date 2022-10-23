import { flexCenter } from '#/style/flexbox';
import { animated, useTransition } from 'react-spring';
import styled, { css } from 'styled-components';
import Spinner from '#/components/spinner';
import ErrorCard from '@/components/error_card';
import absoluteFullSize from '#/style/absolute_full_size';
import { useEffect, useRef } from 'react';
import List from 'react-list';
import useData from './use_data';
import SingerItem from './singer_item';
import { TOOLBAR_HEIGHT } from '../constants';

const Style = styled.div`
  flex: 1;
  min-height: 0;

  position: relative;
`;
const Box = styled(animated.div)`
  ${absoluteFullSize}
`;
const StatusBox = styled(Box)`
  ${flexCenter}
`;
const SingerListBox = styled(Box)`
  > .list {
    height: 100%;
    padding-bottom: ${TOOLBAR_HEIGHT}px;

    overflow: auto;
  }
`;
const Searching = styled.div<{ active: boolean }>`
  ${absoluteFullSize}
  ${flexCenter}

  background-color: rgb(255 255 255 / 0.5);
  transition: 300ms;

  ${({ active }) => css`
    opacity: ${active ? 1 : 0};
    pointer-events: ${active ? 'auto' : 'none'};
  `}
`;

function SingerList() {
  const listRef = useRef<HTMLDivElement>(null);
  const { status, reload, singerList, searching, keyword } = useData();

  useEffect(() => {
    listRef.current?.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, [keyword]);

  const transitions = useTransition(status, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
  });
  return (
    <Style>
      {transitions((style, s) => {
        if (s.error) {
          return (
            <StatusBox style={style}>
              <ErrorCard errorMessage={s.error.message} retry={reload} />
            </StatusBox>
          );
        }
        if (s.loading) {
          return (
            <StatusBox style={style}>
              <Spinner />
            </StatusBox>
          );
        }
        return (
          <SingerListBox>
            <div className="list" ref={listRef}>
              <List
                length={singerList.length}
                type="uniform"
                // eslint-disable-next-line react/no-unstable-nested-components
                itemRenderer={(index, key) => (
                  <SingerItem key={key} singer={singerList[index]} />
                )}
              />
            </div>
            <Searching active={searching}>
              <Spinner />
            </Searching>
          </SingerListBox>
        );
      })}
    </Style>
  );
}

export default SingerList;
