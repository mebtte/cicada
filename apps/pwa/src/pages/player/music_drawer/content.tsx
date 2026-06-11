import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
} from 'react';
import { animated, useTransition } from 'react-spring';
import styled, { css } from 'styled-components';
import ErrorCard from '@/components/error_card';
import Cover, { Shape } from '@/components/cover';
import Spinner from '@/components/spinner';
import absoluteFullSize from '@/style/absolute_full_size';
import autoScrollbar from '@/style/auto_scrollbar';
import upperCaseFirstLetter from '@/style/upper_case_first_letter';
import { flexCenter } from '@/style/flexbox';
import { t } from '@/i18n';
import { MusicType } from '@/constants/music';
import {
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components';
import Info from './info';
import { MusicDetail } from './constants';
import Lyric from './lyric';
import SingerList from './singer_list';
import SubMusicList from './sub_music_list';
import RelatedPublicMusicbillList from './related_public_musicbill_list';
import Toolbar from './toolbar';
import useData from './use_data';
import { FLOATING_CONTROLLER_SCROLL_SPACE } from '../constants';
import playerEventemitter, { EventType } from '../eventemitter';
import { PAGE_HORIZONTAL_PADDING } from '../pages/page';

// Set to false to restore the previous drawer header-only title behavior.
const USE_COLLAPSING_DRAWER_TITLE = true;

const Container = styled(animated.div)`
  ${absoluteFullSize}
`;
const StatusBox = styled(Container)`
  ${flexCenter}
`;
const DetailBox = styled(Container)<{ $floatingControllerOffset: boolean }>`
  display: flex;
  flex-direction: column;
  overflow: hidden;
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
          : 'calc(80px + env(safe-area-inset-bottom, 0))'};
    }
  }
`;
const Header = styled(DrawerHeader)<{ $floating: boolean; $visible: boolean }>`
  z-index: 2;
  ${({ $floating, $visible }) =>
    $floating
      ? css`
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          background-color: ${$visible
            ? 'rgb(255 255 255 / 0.92)'
            : 'transparent'};
          border-bottom: 1px solid
            ${$visible ? 'rgb(229 229 229)' : 'transparent'};
          backdrop-filter: ${$visible ? 'blur(8px)' : 'none'};
        `
      : null}

  height: 72px;
  padding: 0 16px 0 24px;
  box-sizing: border-box;

  display: flex;
  align-items: center;
  transition:
    background-color 160ms ease,
    border-color 160ms ease;
  pointer-events: none;
`;
const HeaderRow = styled.div`
  width: 100%;

  display: flex;
  align-items: center;
  gap: 12px;
`;
const HeaderMeta = styled.div<{ $visible: boolean }>`
  flex: 1;
  min-width: 0;

  display: flex;
  align-items: center;
  gap: 10px;

  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transform: translateY(${({ $visible }) => ($visible ? 0 : '-4px')});
  transition:
    opacity 160ms ease,
    transform 160ms ease;
`;
const HeaderCover = styled.div`
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  padding: 2px;
  box-sizing: border-box;

  background: #fff;
  border: 2px solid rgb(229 229 229);
  border-radius: 12px;
  box-shadow: 0 4px 0 rgb(229 229 229);

  > .header-cover-image {
    border-radius: 8px;
  }
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
const CreateTime = styled.div`
  margin: 18px ${PAGE_HORIZONTAL_PADDING} 0;

  text-align: center;
  color: rgb(160 160 160);
  font-family: 'Nunito', 'Varela Round', system-ui, sans-serif;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.2px;
  ${upperCaseFirstLetter}
`;
const CoverFrame = styled.div<{ $insideDrawer: boolean }>`
  padding: ${({ $insideDrawer }) =>
    $insideDrawer ? '0' : `18px ${PAGE_HORIZONTAL_PADDING} 0`};

  > .cover-shell {
    position: relative;
    overflow: hidden;
    background: rgb(247 247 247);
    border: ${({ $insideDrawer }) =>
      $insideDrawer ? 'none' : '2px solid rgb(229 229 229)'};
    border-radius: ${({ $insideDrawer }) => ($insideDrawer ? 0 : '18px')};
    box-shadow: ${({ $insideDrawer }) =>
      $insideDrawer ? 'none' : '0 5px 0 rgb(229 229 229)'};

    &::after {
      content: '';
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      height: ${({ $insideDrawer }) => ($insideDrawer ? '34%' : '24%')};
      pointer-events: none;
      background: linear-gradient(
        to bottom,
        rgb(255 255 255 / 0),
        rgb(255 255 255 / 0.72) 72%,
        #fff
      );
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
  const scrollableRef = useRef<HTMLDivElement | null>(null);
  const titleRef = useRef<HTMLDivElement | null>(null);
  const [showCollapsedTitle, setShowCollapsedTitle] = useState(
    !USE_COLLAPSING_DRAWER_TITLE,
  );
  const useCollapsingTitle = insideDrawer && USE_COLLAPSING_DRAWER_TITLE;

  const updateCollapsedTitleVisibility = useCallback(() => {
    if (!useCollapsingTitle) {
      setShowCollapsedTitle(true);
      return;
    }

    const scrollableElement = scrollableRef.current;
    const titleElement = titleRef.current;
    if (!scrollableElement || !titleElement) {
      setShowCollapsedTitle(false);
      return;
    }

    const scrollableRect = scrollableElement.getBoundingClientRect();
    const titleRect = titleElement.getBoundingClientRect();
    const nextVisible = titleRect.bottom <= scrollableRect.top + 8;
    setShowCollapsedTitle((current) =>
      current === nextVisible ? current : nextVisible,
    );
  }, [useCollapsingTitle]);

  useEffect(() => {
    if (!useCollapsingTitle) {
      setShowCollapsedTitle(true);
      return;
    }

    setShowCollapsedTitle(false);
    const frame = window.requestAnimationFrame(updateCollapsedTitleVisibility);
    return () => window.cancelAnimationFrame(frame);
  }, [music.id, updateCollapsedTitleVisibility, useCollapsingTitle]);

  return (
    <DetailBox
      style={style}
      $floatingControllerOffset={floatingControllerOffset}
    >
      {insideDrawer ? (
        <Header $floating={useCollapsingTitle} $visible={showCollapsedTitle}>
          <HeaderRow>
            <HeaderMeta $visible={showCollapsedTitle}>
              {useCollapsingTitle && music.cover ? (
                <HeaderCover>
                  <Cover
                    className="header-cover-image"
                    src={music.cover}
                    placeholderSrc={music.coverThumbnail}
                    size="100%"
                    shape={Shape.ROUNDED}
                  />
                </HeaderCover>
              ) : null}
              <HeaderText>
                <MusicDrawerTitle>{music.name}</MusicDrawerTitle>
                {description ? (
                  <MusicDrawerDescription>{description}</MusicDrawerDescription>
                ) : null}
              </HeaderText>
            </HeaderMeta>
          </HeaderRow>
        </Header>
      ) : null}
      <div
        className="scrollable"
        ref={scrollableRef}
        onScroll={
          useCollapsingTitle ? updateCollapsedTitleVisibility : undefined
        }
      >
        <div className="first-screen">
          <DetailContent $insideDrawer={insideDrawer}>
            {music.cover ? (
              <CoverFrame $insideDrawer={insideDrawer}>
                <div className="cover-shell">
                  <Cover
                    src={music.cover}
                    placeholderSrc={music.coverThumbnail}
                    size="100%"
                    shape={Shape.SQUARE}
                  />
                </div>
              </CoverFrame>
            ) : null}
            <Info
              music={music}
              showTitle={!insideDrawer || USE_COLLAPSING_DRAWER_TITLE}
              titleRef={titleRef}
            />
            <SingerList label={t('singer')} singerList={music.singers} />
            {music.type === MusicType.SONG ? (
              <SingerList label={t('lyricist')} singerList={music.lyricists} />
            ) : null}
            <SingerList label={t('composer')} singerList={music.composers} />
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
            <RelatedPublicMusicbillList
              musicbillList={music.relatedPublicMusicbillList}
            />
            <Lyric music={music} />
            {/* 音乐创建时间, 居中显示在抽屉内容最底部 */}
            <CreateTime>{t('create_at')} {music.createTime}</CreateTime>
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
