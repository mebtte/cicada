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
import WidthObserver from '@/components/width_observer';
import getResizedImage from '@/server/asset/get_resized_image';
import autoScrollbar from '@/style/auto_scrollbar';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../../eventemitter';
import {
  PAGE_SIZE,
  TOOLBAR_HEIGHT,
  MINI_MODE_TOOLBAR_HEIGHT,
} from '../constants';
import useData from './use_data';
import { openCreateSingerDialog } from '../../../utils';
import Singer from './singer';
import TextGuide from '../text_guide';

const ITEM_MIN_WIDTH = 150;
const Container = styled(animated.div)`
  ${absoluteFullSize}
`;
const CardContainer = styled(Container)`
  ${flexCenter}

  flex-direction: column;
  gap: 20px;
`;
const SingerContainer = styled(Container)`
  overflow: auto;
  ${autoScrollbar}

  > .list {
    --gap: 10px;

    margin: 0 var(--gap);

    display: flex;
    align-items: flex-start;
    flex-wrap: wrap;

    > .item {
      padding: var(--gap);
    }
  }

  ${({ theme: { miniMode } }) => css`
    padding-top: ${miniMode ? MINI_MODE_TOOLBAR_HEIGHT : TOOLBAR_HEIGHT}px;
  `}
`;
const paginationStyle: CSSProperties = {
  margin: '20px 0',
};

function Wrapper() {
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
          <Empty description="未找到相关歌手" />
          <Button
            variant={Variant.PRIMARY}
            onClick={() =>
              openCreateSingerDialog((id) =>
                playerEventemitter.emit(PlayerEventType.OPEN_SINGER_DRAWER, {
                  id,
                }),
              )
            }
          >
            自己创建一个
          </Button>
        </CardContainer>
      );
    }
    return (
      <SingerContainer style={style}>
        <WidthObserver
          className="list"
          render={(width) => {
            const itemWidth = `${100 / Math.floor(width / ITEM_MIN_WIDTH)}%`;
            return d.value!.singerList.map((singer) => (
              <div
                key={singer.id}
                className="item"
                style={{ width: itemWidth }}
              >
                <Singer
                  singerId={singer.id}
                  singerName={singer.name}
                  singerAvatar={getResizedImage({
                    url: singer.avatar,
                    size: ITEM_MIN_WIDTH * window.devicePixelRatio,
                  })}
                  singerAliases={singer.aliases}
                />
              </div>
            ));
          }}
        />
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
        {page !== Math.ceil(d.value!.total / PAGE_SIZE) ? null : (
          <TextGuide
            text1="找不到想要的歌手?"
            text2="自己创建一个"
            onGuide={() =>
              openCreateSingerDialog((id) =>
                playerEventemitter.emit(PlayerEventType.OPEN_SINGER_DRAWER, {
                  id,
                }),
              )
            }
          />
        )}
      </SingerContainer>
    );
  });
}

export default Wrapper;
