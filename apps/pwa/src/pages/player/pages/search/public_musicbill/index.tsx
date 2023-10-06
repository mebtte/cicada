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
import { t } from '@/i18n';
import {
  PAGE_SIZE,
  TOOLBAR_HEIGHT,
  MINI_MODE_TOOLBAR_HEIGHT,
} from '../constants';
import useData from './use_data';
import { openCreateMusicbillDialog } from '../../../utils';
import PublicMusicbill from '../../../components/public_musicbill';
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
const MusicContainer = styled(Container)`
  overflow: auto;
  ${autoScrollbar}

  > .list {
    margin: 0 10px;

    display: flex;
    align-items: flex-start;
    flex-wrap: wrap;

    > .item {
      padding: 10px;
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
          <Empty description={t('no_suitable_musicbill')} />
          <Button variant={Variant.PRIMARY} onClick={openCreateMusicbillDialog}>
            {t('create_musicbill_by_yourself')}
          </Button>
        </CardContainer>
      );
    }

    return (
      <MusicContainer style={style}>
        <WidthObserver
          className="list"
          render={(width) => {
            const itemWidth = `${100 / Math.floor(width / ITEM_MIN_WIDTH)}%`;
            return d.value!.musicbillList.map((musicbill) => (
              <div
                className="item"
                key={musicbill.id}
                style={{ width: itemWidth }}
              >
                <PublicMusicbill
                  id={musicbill.id}
                  cover={getResizedImage({
                    url: musicbill.cover,
                    size: Math.ceil(ITEM_MIN_WIDTH * window.devicePixelRatio),
                  })}
                  name={musicbill.name}
                  userId={musicbill.user.id}
                  userNickname={musicbill.user.nickname}
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
            text1={t('no_suitable_musicbill_warning')}
            text2={t('create_musicbill_by_yourself')}
            onGuide={openCreateMusicbillDialog}
          />
        )}
      </MusicContainer>
    );
  });
}

export default Wrapper;
