import { flexCenter } from '#/style/flexbox';
import { animated, useTransition } from 'react-spring';
import styled from 'styled-components';
import Spinner from '#/components/spinner';
import ErrorCard from '@/components/error_card';
import absoluteFullSize from '#/style/absolute_full_size';
import { useEffect, useRef } from 'react';
import List from 'react-list';
import { CSSVariable } from '#/global_style';
import Empty from '@/components/empty';
import Button, { Variant } from '#/components/button';
import useData from './use_data';
import SingerItem from './singer_item';
import { TOOLBAR_HEIGHT } from '../constants';
import Row from './row';
import { openCreateSingerDialog } from '../utils';

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

  flex-direction: column;
  gap: 20px;
`;
const SingerListBox = styled(Box)`
  padding-bottom: ${TOOLBAR_HEIGHT}px;

  overflow: auto;
`;
const Head = styled(Row)`
  z-index: 1;

  position: sticky;
  height: 30;
  top: 0;

  backdrop-filter: blur(5px);
`;
const RowHead = styled.div`
  font-size: 12px;
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
`;

function SingerList() {
  const listRef = useRef<HTMLDivElement>(null);
  const { status, reload, singerList, keyword } = useData();

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
        if (singerList.length) {
          return (
            <SingerListBox style={style}>
              <Head
                one={null}
                two={<RowHead>名字/别名</RowHead>}
                three={<RowHead>音乐数</RowHead>}
                four={<RowHead>创建时间</RowHead>}
              />
              <List
                length={singerList.length}
                type="uniform"
                // eslint-disable-next-line react/no-unstable-nested-components
                itemRenderer={(index, key) => (
                  <SingerItem key={key} singer={singerList[index]} />
                )}
              />
            </SingerListBox>
          );
        }
        return (
          <StatusBox style={style}>
            <Empty description="暂未相关歌手" />
            <Button variant={Variant.PRIMARY} onClick={openCreateSingerDialog}>
              创建歌手
            </Button>
          </StatusBox>
        );
      })}
    </Style>
  );
}

export default SingerList;
