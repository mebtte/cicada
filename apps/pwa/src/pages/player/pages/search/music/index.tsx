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
import Button, { Variant } from '@/components/button';
import { PLAYER_PATH, ROOT_PATH } from '@/constants/route';
import mm from '@/global_states/mini_mode';
import {
  MINI_MODE_TOOLBAR_HEIGHT,
  PAGE_SIZE,
  TOOLBAR_HEIGHT,
} from '../constants';
import useData from './use_data';
import Music from '../../../components/music';
import CreateMusicGuide from '../create_music_guide';
import Context from '../../../context';

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
          <Empty description="未找到相关音乐" />
          <Button
            variant={Variant.PRIMARY}
            onClick={() =>
              navigate({
                path: ROOT_PATH.PLAYER + PLAYER_PATH.MY_MUSIC,
                query: {
                  [Query.CREATE_MUSIC_DIALOG_OPEN]: 1,
                },
              })
            }
          >
            自己创建一首
          </Button>
        </CardContainer>
      );
    }
    return (
      <MusicContainer style={style} exploration={exploration ? 1 : 0}>
        <div className="list">
          {d.value!.musicList.map((music) => (
            <Music
              key={music.id}
              music={music}
              active={playqueue[currentPlayqueuePosition]?.id === music.id}
              miniMode={miniMode}
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
          <CreateMusicGuide />
        )}
      </MusicContainer>
    );
  });
}

export default Wrapper;
