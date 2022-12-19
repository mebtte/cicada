import Spinner from '@/components/spinner';
import { flexCenter } from '@/style/flexbox';
import { animated, useTransition } from 'react-spring';
import styled from 'styled-components';
import ErrorCard from '@/components/error_card';
import { memo } from 'react';
import getRandomCover from '@/utils/get_random_cover';
import useNavigate from '@/utils/use_navigate';
import { PLAYER_PATH } from '@/constants/route';
import { Query } from '@/constants';
import { HEADER_HEIGHT } from '../../constants';
import Page from '../page';
import useData from './use_data';
import Part from './part';
import { Exploration as ExplorationType } from './constants';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../eventemitter';
import { openCreateSingerDialog } from '../../utils';

const Root = styled(Page)`
  position: relative;
`;
const Container = styled(animated.div)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;

  padding-top: ${HEADER_HEIGHT}px;
`;
const StatusContainer = styled(Container)`
  ${flexCenter}
`;
const ContentContainer = styled(Container)`
  overflow: auto;

  padding-bottom: env(safe-area-inset-bottom, 0);
`;

const openMusicDrawer = (id: string) =>
  playerEventemitter.emit(PlayerEventType.OPEN_MUSIC_DRAWER, { id });
const openSingerDrawer = (id: string) =>
  playerEventemitter.emit(PlayerEventType.OPEN_SINGER_DRAWER, { id });
const openMusicbillDrawer = (id: string) =>
  playerEventemitter.emit(PlayerEventType.OPEN_MUSICBILL_DRAWER, { id });

// eslint-disable-next-line react/display-name
const Exploration = memo(
  ({
    exploration,
    reload,
  }: {
    exploration: ExplorationType;
    reload: () => void;
  }) => {
    const navigate = useNavigate();
    return (
      <>
        <Part
          title="音乐"
          list={exploration.musicList.map((m) => ({
            id: m.id,
            title: m.name,
            subTitle: m.singers.map((s) => s.name).join(', '),
            cover: m.cover || getRandomCover(),
          }))}
          onItemClick={openMusicDrawer}
          onCreate={() =>
            navigate({
              path: PLAYER_PATH.MY_MUSIC,
              query: {
                [Query.CREATE_MUSIC_DIALOG_OPEN]: 1,
              },
            })
          }
        />
        <Part
          title="歌手"
          list={exploration.singerList.map((s) => ({
            id: s.id,
            title: s.name,
            subTitle: s.aliases.length ? s.aliases[0] : '',
            cover: s.avatar || getRandomCover(),
          }))}
          onItemClick={openSingerDrawer}
          onCreate={() =>
            openCreateSingerDialog((id) => {
              openSingerDrawer(id);
              return reload();
            })
          }
        />
        {exploration.musicbillList.length ? (
          <Part
            title="乐单"
            list={exploration.musicbillList.map((mb) => ({
              id: mb.id,
              title: mb.name,
              subTitle: mb.user.nickname,
              cover: mb.cover || getRandomCover(),
            }))}
            onItemClick={openMusicbillDrawer}
          />
        ) : null}
      </>
    );
  },
);

function Wrapper() {
  const { data, reload } = useData();

  const transitions = useTransition(data, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
  });
  return (
    <Root>
      {transitions((style, d) => {
        if (d.error) {
          return (
            <StatusContainer style={style}>
              <ErrorCard errorMessage="xxxx" retry={reload} />
            </StatusContainer>
          );
        }
        if (d.loading) {
          return (
            <StatusContainer style={style}>
              <Spinner />
            </StatusContainer>
          );
        }
        return (
          <ContentContainer style={style}>
            <Exploration exploration={d.data} reload={reload} />
          </ContentContainer>
        );
      })}
    </Root>
  );
}

export default Wrapper;
