import absoluteFullSize from '@/style/absolute_full_size';
import { flexCenter } from '@/style/flexbox';
import { animated, useTransition } from 'react-spring';
import styled from 'styled-components';
import ErrorCard from '@/components/error_card';
import Spinner from '@/components/spinner';
import Empty from '@/components/empty';
import Pagination from '@/components/pagination';
import useNavigate from '@/utils/use_navigate';
import { Query } from '@/constants';
import { CSSProperties } from 'react';
import SizeObserver from '@/components/size_observer';
import getResizedImage from '@/server/asset/get_resized_image';
import autoScrollbar from '@/style/auto_scrollbar';
import { t } from '@/i18n';
import { PAGE_SIZE } from '../constants';
import { FLOATING_CONTROLLER_SCROLL_SPACE } from '../../../constants';
import useData from './use_data';
import Singer from './singer';

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

  &::after {
    content: '';
    display: block;
    height: ${FLOATING_CONTROLLER_SCROLL_SPACE};
  }
`;
const paginationStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
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
          <Empty description={t('no_suitable_singer')} />
        </CardContainer>
      );
    }
    return (
      <SingerContainer style={style}>
        <SizeObserver className="list">
          {({ width }) => {
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
                    size: Math.ceil(ITEM_MIN_WIDTH * window.devicePixelRatio),
                  })}
                  singerAliases={singer.aliases}
                />
              </div>
            ));
          }}
        </SizeObserver>
        {d.value!.total ? (
          <Pagination
            style={paginationStyle}
            page={page}
            count={Math.ceil(d.value!.total / PAGE_SIZE)}
            onChange={(p) =>
              navigate({
                query: {
                  [Query.PAGE]: p,
                },
              })
            }
          />
        ) : null}
      </SingerContainer>
    );
  });
}

export default Wrapper;
