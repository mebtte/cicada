/* eslint-disable react/no-unstable-nested-components */
import Spinner from '@/components/spinner';
import { flexCenter } from '@/style/flexbox';
import { animated, useTransition } from 'react-spring';
import styled from 'styled-components';
import ErrorCard from '@/components/error_card';
import { memo } from 'react';
import DefaultCover from '@/asset/default_cover.jpeg';
import useNavigate from '@/utils/use_navigate';
import { PLAYER_PATH, ROOT_PATH } from '@/constants/route';
import { Query } from '@/constants';
import { CSSVariable } from '@/global_style';
import ellipsis from '@/style/ellipsis';
import { HEADER_HEIGHT } from '../../constants';
import Page from '../page';
import useData from './use_data';
import Part from './part';
import { Exploration as ExplorationType } from './constants';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../eventemitter';
import { openCreateSingerDialog } from '../../utils';
import Singer from '../../components/singer';

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
const SubTitle = styled.div`
  max-width: 100%;

  ${ellipsis}
  font-size: 12px;
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
`;
const MusicbillSubTitle = styled(SubTitle)`
  > span {
    cursor: pointer;

    &:hover {
      color: ${CSSVariable.TEXT_COLOR_PRIMARY};
    }
  }
`;

const openMusicDrawer = (id: string) =>
  playerEventemitter.emit(PlayerEventType.OPEN_MUSIC_DRAWER, { id });
const openSingerDrawer = (id: string) =>
  playerEventemitter.emit(PlayerEventType.OPEN_SINGER_DRAWER, { id });
const openMusicbillDrawer = (id: string) =>
  playerEventemitter.emit(PlayerEventType.OPEN_PUBLIC_MUSICBILL_DRAWER, { id });

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
            subTitleRenderer: () => (
              <SubTitle>
                {m.singers.map((s) => (
                  <Singer key={s.id} singer={s} />
                ))}
              </SubTitle>
            ),
            cover: m.cover || DefaultCover,
          }))}
          onItemClick={openMusicDrawer}
          onCreate={() =>
            navigate({
              path: ROOT_PATH.PLAYER + PLAYER_PATH.MY_MUSIC,
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
            subTitleRenderer: () =>
              s.aliases.length ? <SubTitle>{s.aliases[0]}</SubTitle> : null,
            cover: s.avatar || DefaultCover,
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
              subTitleRenderer: () => (
                <MusicbillSubTitle>
                  <span
                    onClick={() =>
                      playerEventemitter.emit(
                        PlayerEventType.OPEN_USER_DRAWER,
                        { id: mb.user.id },
                      )
                    }
                  >
                    {mb.user.nickname}
                  </span>
                </MusicbillSubTitle>
              ),
              cover: mb.cover || DefaultCover,
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
              <ErrorCard errorMessage={d.error.message} retry={reload} />
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
