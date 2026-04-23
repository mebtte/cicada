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
import { CSSProperties, useContext } from 'react';
import autoScrollbar from '@/style/auto_scrollbar';
import { t } from '@/i18n';
import {
  MINI_MODE_TOOLBAR_HEIGHT,
  PAGE_SIZE,
  TOOLBAR_HEIGHT,
} from '../constants';
import useData from './use_data';
import Music from '../../../components/music';
import Context from '../../../context';

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

  ${({ theme: { miniMode } }) => css`
    padding-top: ${miniMode ? MINI_MODE_TOOLBAR_HEIGHT : TOOLBAR_HEIGHT}px;
  `}
`;
const paginationStyle: CSSProperties = {
  margin: '20px 0',
};

function Wrapper() {
  const navigate = useNavigate();

  const { playqueue, currentPlayqueuePosition } = useContext(Context);
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
          <Empty description={t('no_suitable_music')} />
        </CardContainer>
      );
    }
    return (
      <MusicContainer style={style}>
        <div className="list">
          {d.value.musicList.map((music, index) => (
            <Music
              key={music.id}
              index={d.value.total - PAGE_SIZE * (page - 1) - index}
              music={music}
              active={playqueue[currentPlayqueuePosition]?.id === music.id}
            />
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
      </MusicContainer>
    );
  });
}

export default Wrapper;
