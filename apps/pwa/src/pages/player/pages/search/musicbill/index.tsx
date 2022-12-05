import absoluteFullSize from '@/style/absolute_full_size';
import { flexCenter } from '@/style/flexbox';
import { animated, useTransition } from 'react-spring';
import styled, { css } from 'styled-components';
import ErrorCard from '@/components/error_card';
import Spinner from '@/components/spinner';
import Empty from '@/components/empty';
import Pagination from '@/components/pagination';
import useNavigate from '@/utils/use_navigate';
import { Query } from '@/constants';
import { CSSProperties } from 'react';
import Button, { Variant } from '@/components/button';
import mm from '@/global_states/mini_mode';
import {
  PAGE_SIZE,
  TOOLBAR_HEIGHT,
  MINI_MODE_TOOLBAR_HEIGHT,
} from '../constants';
import useData from './use_data';
import { openCreateMusicbillDialog } from '../../../utils';
import Musicbill from '../../../components/musicbill';
import TextGuide from '../text_guide';

const Container = styled(animated.div)`
  ${absoluteFullSize}
`;
const CardContainer = styled(Container)`
  ${flexCenter}

  flex-direction: column;
  gap: 20px;
`;
const MusicContainer = styled(Container)<{ exploration: 0 | 1 }>`
  overflow: auto;

  ${({ exploration, theme: { miniMode } }) => css`
    padding-top: ${miniMode && !exploration
      ? MINI_MODE_TOOLBAR_HEIGHT
      : TOOLBAR_HEIGHT}px;
  `}
`;
const paginationStyle: CSSProperties = {
  margin: '20px 0',
};

function Wrapper({ exploration }: { exploration: boolean }) {
  const navigate = useNavigate();
  const miniMode = mm.useState();
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

    const musicbillStyle: CSSProperties = {
      width: miniMode ? '100%' : '50%',
    };
    return (
      <MusicContainer style={style} exploration={exploration ? 1 : 0}>
        <div>
          {d.value!.musicbillList.map((musicbill) => (
            <Musicbill
              key={musicbill.id}
              id={musicbill.id}
              cover={musicbill.cover}
              name={musicbill.name}
              musicCount={musicbill.musicCount}
              user={musicbill.user}
              style={musicbillStyle}
            />
          ))}
        </div>
        {d.value!.total && !exploration ? (
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
