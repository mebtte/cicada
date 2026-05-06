import { useEffect, type ComponentProps } from 'react';
import { animated, useTransition } from 'react-spring';
import styled, { css } from 'styled-components';
import ErrorCard from '@/components/error_card';
import Cover, { Shape } from '@/components/cover';
import Spinner from '@/components/spinner';
import absoluteFullSize from '@/style/absolute_full_size';
import autoScrollbar from '@/style/auto_scrollbar';
import { flexCenter } from '@/style/flexbox';
import { t } from '@/i18n';
import {
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from '@/components';
import Button from '@/components/button';
import Info, { MusicMetaList } from './info';
import { MusicDetail } from './constants';
import Lyric from './lyric';
import SingerList from './singer_list';
import SubMusicList from './sub_music_list';
import Toolbar from './toolbar';
import useData from './use_data';
import { FLOATING_CONTROLLER_SCROLL_SPACE } from '../constants';
import playerEventemitter, { EventType } from '../eventemitter';

const Container = styled(animated.div)`
  ${absoluteFullSize}
`;
const StatusBox = styled(Container)`
  ${flexCenter}
`;
const DetailBox = styled(Container)<{ $floatingControllerOffset: boolean }>`
  display: flex;
  flex-direction: column;
  background: #fff;

  > .scrollable {
    flex: 1;
    min-height: 0;

    overflow: auto;
    ${autoScrollbar}

    > .first-screen {
      min-height: 100%;
    }

    &::after {
      content: '';
      display: block;
      height: ${({ $floatingControllerOffset }) =>
        $floatingControllerOffset
          ? `calc(64px + env(safe-area-inset-bottom, 0) + ${FLOATING_CONTROLLER_SCROLL_SPACE})`
          : '18px'};
    }
  }
`;
const Header = styled(DrawerHeader)`
  height: 72px;
  padding: 0 16px 0 24px;
  box-sizing: border-box;

  display: flex;
  align-items: center;
`;
const HeaderRow = styled.div`
  width: 100%;

  display: flex;
  align-items: center;
  gap: 12px;
`;
const HeaderText = styled.div`
  flex: 1;
  min-width: 0;
`;
const titleStyle = css`
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  && {
    color: rgb(50 50 50);
    font-weight: 800;
    font-size: 22px;
    line-height: 1.15;
    letter-spacing: 0.2px;
  }
`;
const MusicDrawerTitle = styled(DrawerTitle)`
  ${titleStyle}
`;
const descriptionStyle = css`
  margin: 4px 0 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  && {
    margin-top: 4px;
    color: rgb(140 140 140);
    font-size: 14px;
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: 0.1px;
  }
`;
const MusicDrawerDescription = styled(DrawerDescription)`
  ${descriptionStyle}
`;
const DetailContent = styled.div<{ $insideDrawer: boolean }>`
  width: 100%;
  max-width: ${({ $insideDrawer }) => ($insideDrawer ? 'none' : '520px')};
  margin: 0 auto;
`;
const CoverFrame = styled.div<{ $insideDrawer: boolean }>`
  padding: ${({ $insideDrawer }) =>
    $insideDrawer ? '0' : '18px 20px 0'};

  > .cover-shell {
    position: relative;
    overflow: hidden;
    background: rgb(247 247 247);
    border: ${({ $insideDrawer }) =>
      $insideDrawer ? 'none' : '2px solid rgb(229 229 229)'};
    border-radius: ${({ $insideDrawer }) => ($insideDrawer ? 0 : '18px')};
    box-shadow: ${({ $insideDrawer }) =>
      $insideDrawer ? 'none' : '0 5px 0 rgb(229 229 229)'};

    > .cover-meta {
      position: absolute;
      left: 10px;
      right: 10px;
      bottom: 10px;
      z-index: 1;

      display: flex;
      justify-content: flex-start;
    }
  }
`;

type AnimatedStyle = ComponentProps<typeof animated.div>['style'];

const getDescription = (music: MusicDetail) =>
  music.aliases.length ? music.aliases.join(' / ') : undefined;

function Detail({
  style,
  music,
  floatingControllerOffset,
  insideDrawer,
}: {
  style: AnimatedStyle;
  music: MusicDetail;
  floatingControllerOffset: boolean;
  insideDrawer: boolean;
}) {
  const description = getDescription(music);

  return (
    <DetailBox
      style={style}
      $floatingControllerOffset={floatingControllerOffset}
    >
      {insideDrawer ? (
        <Header>
          <HeaderRow>
            <HeaderText>
              <MusicDrawerTitle>{music.name}</MusicDrawerTitle>
              {description ? (
                <MusicDrawerDescription>{description}</MusicDrawerDescription>
              ) : null}
            </HeaderText>
            <DrawerClose asChild>
              <Button variant="ghost" size="sm" square aria-label="Close">
                <svg
                  width={18}
                  height={18}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </Button>
            </DrawerClose>
          </HeaderRow>
        </Header>
      ) : null}
      <div className="scrollable">
        <div className="first-screen">
          <DetailContent $insideDrawer={insideDrawer}>
            <CoverFrame $insideDrawer={insideDrawer}>
              <div className="cover-shell">
                <Cover src={music.cover} size="100%" shape={Shape.SQUARE} />
                <div className="cover-meta">
                  <MusicMetaList music={music} compact />
                </div>
              </div>
            </CoverFrame>
            <Info music={music} showTitle={!insideDrawer} />
            <SingerList singerList={music.singers} />
            {music.forkFromList.length ? (
              <SubMusicList
                label={t('fork_from_these_musics')}
                musicList={music.forkFromList}
              />
            ) : null}
            {music.forkList.length ? (
              <SubMusicList
                label={t('forked_by_these_musics')}
                musicList={music.forkList}
              />
            ) : null}
            <Lyric music={music} />
          </DetailContent>
        </div>
      </div>
      <Toolbar
        music={music}
        floatingControllerOffset={floatingControllerOffset}
      />
    </DetailBox>
  );
}

function MusicContent({
  id,
  insideDrawer = false,
  floatingControllerOffset = false,
}: {
  id: string;
  insideDrawer?: boolean;
  floatingControllerOffset?: boolean;
}) {
  const { data, reload } = useData(id);

  useEffect(() => {
    if (!insideDrawer && data.music) {
      playerEventemitter.emit(EventType.MUSIC_DETAIL_LOADED, {
        id: data.music.id,
        name: data.music.name,
        aliases: data.music.aliases,
        singers: data.music.singers.map((s) => ({
          id: s.id,
          name: s.name,
        })),
      });
    }
  }, [data.music, insideDrawer]);

  const transitions = useTransition(data, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
  });

  return transitions((style, d) => {
    if (d.error) {
      return (
        <StatusBox style={style}>
          <ErrorCard errorMessage={d.error.message} retry={reload} />
        </StatusBox>
      );
    }

    if (d.loading) {
      return (
        <StatusBox style={style}>
          <Spinner />
        </StatusBox>
      );
    }

    return (
      <Detail
        style={style}
        music={d.music!}
        floatingControllerOffset={floatingControllerOffset}
        insideDrawer={insideDrawer}
      />
    );
  });
}

export default MusicContent;
