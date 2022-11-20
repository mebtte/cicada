import absoluteFullSize from '#/style/absolute_full_size';
import { flexCenter } from '#/style/flexbox';
import { animated, useTransition } from 'react-spring';
import styled from 'styled-components';
import ErrorCard from '@/components/error_card';
import Spinner from '#/components/spinner';
import Empty from '@/components/empty';
import Pagination from '#/components/pagination';
import useNavigate from '#/utils/use_navigate';
import { Query } from '@/constants';
import { CSSProperties } from 'react';
import Button, { Variant } from '#/components/button';
import { PAGE_SIZE, TOOLBAR_HEIGHT } from '../constants';
import useData from './use_data';
import { openCreateMusicbillDialog } from '../../../utils';
import Musicbill from './musicbill';
import TextGuide from '../text_guide';

const Container = styled(animated.div)`
  ${absoluteFullSize}
`;
const CardContainer = styled(Container)`
  ${flexCenter}

  flex-direction: column;
  gap: 20px;
`;
const MusicContainer = styled(Container)`
  padding-top: ${TOOLBAR_HEIGHT}px;

  overflow: auto;
`;
const paginationStyle: CSSProperties = {
  margin: '20px 0',
};

function Wrapper({ exploration }: { exploration: boolean }) {
  const navigate = useNavigate();
  const { data, reload, page } = useData();

  const transitions = useTransition(data, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
  });
  return transitions((style, d) => {
    if (d.error) {
      return (
        <CardContainer style={style}>
          <ErrorCard errorMessage={d.error.message} retry={reload} />
        </CardContainer>
      );
    }
    if (d.loading) {
      return (
        <CardContainer style={style}>
          <Spinner />
        </CardContainer>
      );
    }
    if (!d.value!.total) {
      return (
        <CardContainer style={style}>
          <Empty description="未找到相关乐单" />
          <Button variant={Variant.PRIMARY} onClick={openCreateMusicbillDialog}>
            自己创建一个
          </Button>
        </CardContainer>
      );
    }
    return (
      <MusicContainer style={style}>
        <div>
          {d.value!.musicbillList.map((musicbill) => (
            <Musicbill key={musicbill.id} musicbill={musicbill} />
          ))}
        </div>
        {d.value!.total ? (
          <Pagination
            style={paginationStyle}
            page={page}
            pageSize={PAGE_SIZE}
            total={d.value!.total}
            onChange={(p) =>
              navigate({
                query: {
                  [Query.PAGE]: p,
                },
              })
            }
          />
        ) : null}
        {exploration ||
        page !== Math.ceil(d.value!.total / PAGE_SIZE) ? null : (
          <TextGuide
            text1="找不到想要的乐单?"
            text2="创建一个"
            onGuide={openCreateMusicbillDialog}
          />
        )}
      </MusicContainer>
    );
  });
}

export default Wrapper;
