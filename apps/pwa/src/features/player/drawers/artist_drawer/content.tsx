import styled, { css } from 'styled-components';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
} from 'react';
import { animated, useTransition } from '@react-spring/web';
import absoluteFullSize from '@/style/absolute_full_size';
import { flexCenter } from '@/style/flexbox';
import { t } from '@/i18n';
import ErrorCard from '@/components/error_card';
import Spinner from '@/components/spinner';
import autoScrollbar from '@/style/auto_scrollbar';
import { CSSVariable } from '@/global_style';
import { DrawerDescription, DrawerHeader, DrawerTitle } from '@/components';
import { TabList, type TabItem } from '@/components/tabs';
import Cover, { CoverFallback, Shape } from '@/components/cover';
import useData from './use_data';
import { Artist } from './constants';
import Info from './info';
import Toolbar from './toolbar';
import MusicList from './music_list';
import playerEventemitter, { EventType } from '../../eventemitter';
import { FLOATING_CONTROLLER_SCROLL_SPACE } from '../../constants';
import { PAGE_HORIZONTAL_PADDING } from '../../page_layout';

enum ArtistMusicTab {
  PERFORMER = 'performer',
  LYRICIST = 'lyricist',
  COMPOSER = 'composer',
}

const Container = styled(animated.div)`
  ${absoluteFullSize}
`;
const CardContainer = styled(Container)`
  ${flexCenter}
`;
const DetailContainer = styled(Container)<{
  $floatingControllerOffset: boolean;
  $insideDrawer: boolean;
}>`
  display: flex;
  flex-direction: column;

  /* 抽屉内整体宽度只有 ~400px, 压缩默认横向 padding 让内容更宽松。 */
  ${({ $insideDrawer }) =>
    $insideDrawer ? '--player-page-horizontal-padding: 12px;' : ''}

  > .scrollable {
    flex: 1;
    min-height: 0;

    overflow: auto;
    ${autoScrollbar}

    /* 底部留白合并进 first-screen，避免内容少时仍产生 100% + padding 的溢出滚动 */
    > .first-screen {
      min-height: 100%;
      padding-bottom: ${({ $floatingControllerOffset }) =>
        $floatingControllerOffset
          ? `calc(64px + env(safe-area-inset-bottom, 0) + ${FLOATING_CONTROLLER_SCROLL_SPACE})`
          : 'calc(68px + env(safe-area-inset-bottom, 0))'};
      box-sizing: border-box;
    }
  }
`;
const COLLAPSED_HEADER_HEIGHT = 72;
const Header = styled(DrawerHeader)<{ $visible: boolean }>`
  z-index: 2;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: ${COLLAPSED_HEADER_HEIGHT}px;
  padding: 0 20px;
  box-sizing: border-box;

  display: flex;
  align-items: center;
  pointer-events: none;

  background-color: ${({ $visible }) =>
    $visible ? '#fff' : 'transparent'};
  border-bottom: 1px solid
    ${({ $visible }) =>
      $visible ? CSSVariable.COLOR_NEUTRAL_SHADOW : 'transparent'};
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transform: translateY(${({ $visible }) => ($visible ? 0 : '-4px')});
  transition:
    opacity 160ms ease,
    transform 160ms ease,
    background-color 160ms ease,
    border-color 160ms ease;
`;
const HeaderText = styled.div`
  flex: 1;
  min-width: 0;
`;
const HeaderCover = styled.div`
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  margin-right: 10px;
  padding: 2px;
  box-sizing: border-box;

  background: #fff;
  border: 2px solid ${CSSVariable.COLOR_NEUTRAL_SHADOW};
  border-radius: 12px;
  box-shadow: 0 4px 0 ${CSSVariable.COLOR_NEUTRAL_SHADOW};

  > .header-cover-image {
    border-radius: 8px;
  }
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
const ArtistDrawerTitle = styled(DrawerTitle)`
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
const ArtistDrawerDescription = styled(DrawerDescription)`
  ${descriptionStyle}
`;
const TAB_EXTRA_INSET = 12;
const MusicTabs = styled.div<{ $stickyTop: number }>`
  position: sticky;
  top: ${({ $stickyTop }) => $stickyTop}px;
  z-index: 1;
  /* Tab 比下方 MusicList 内容再多收一截, 参考搜索页 search-tabs 的 inset 习惯。 */
  padding: 12px calc(${PAGE_HORIZONTAL_PADDING} + ${TAB_EXTRA_INSET}px) 8px;
  /* 透明容器, 下方滚动内容透出。 */
  pointer-events: none;

  > * {
    pointer-events: auto;
  }
`;
type AnimatedStyle = ComponentProps<typeof animated.div>['style'];

function Detail({
  style,
  artist,
  insideDrawer,
}: {
  style: AnimatedStyle;
  artist: Artist;
  insideDrawer: boolean;
}) {
  // Only photos with displayable artwork should occupy photo UI slots.
  const coverPhoto = artist.photos.find(
    (photo) => photo.asset || photo.thumbnail,
  );
  const scrollableRef = useRef<HTMLDivElement | null>(null);
  const identityRef = useRef<HTMLElement | null>(null);
  const [showCollapsedHeader, setShowCollapsedHeader] = useState(false);
  const [tab, setTab] = useState<ArtistMusicTab>(ArtistMusicTab.PERFORMER);
  const useCollapsingHeader = insideDrawer;
  const tabs: TabItem<ArtistMusicTab>[] = [
    ...(artist.performerMusicList.length
      ? [{ tab: ArtistMusicTab.PERFORMER, label: t('performed_music') }]
      : []),
    ...(artist.lyricistMusicList.length
      ? [{ tab: ArtistMusicTab.LYRICIST, label: t('lyricist_music') }]
      : []),
    ...(artist.composerMusicList.length
      ? [{ tab: ArtistMusicTab.COMPOSER, label: t('composer_music') }]
      : []),
  ];
  const activeTab = tabs.some((item) => item.tab === tab) ? tab : tabs[0]?.tab;
  const currentTab = activeTab ?? ArtistMusicTab.PERFORMER;
  const musicList =
    activeTab === ArtistMusicTab.LYRICIST
      ? artist.lyricistMusicList
      : activeTab === ArtistMusicTab.COMPOSER
        ? artist.composerMusicList
        : artist.performerMusicList;

  const updateCollapsedHeaderVisibility = useCallback(() => {
    if (!useCollapsingHeader) {
      setShowCollapsedHeader(false);
      return;
    }

    const scrollableElement = scrollableRef.current;
    const identityElement = identityRef.current;
    if (!scrollableElement || !identityElement) {
      setShowCollapsedHeader(false);
      return;
    }

    const scrollableRect = scrollableElement.getBoundingClientRect();
    const identityRect = identityElement.getBoundingClientRect();
    const nextVisible = identityRect.bottom <= scrollableRect.top + 8;
    setShowCollapsedHeader((current) =>
      current === nextVisible ? current : nextVisible,
    );
  }, [useCollapsingHeader]);

  useEffect(() => {
    if (!useCollapsingHeader) {
      setShowCollapsedHeader(false);
      return;
    }

    setShowCollapsedHeader(false);
    const frame = window.requestAnimationFrame(updateCollapsedHeaderVisibility);
    return () => window.cancelAnimationFrame(frame);
  }, [artist.id, updateCollapsedHeaderVisibility, useCollapsingHeader]);

  useEffect(() => {
    if (tabs.length && !tabs.some((item) => item.tab === tab)) {
      setTab(tabs[0].tab);
    }
  }, [tab, tabs]);

  return (
    <DetailContainer
      style={style}
      $floatingControllerOffset={!insideDrawer}
      $insideDrawer={insideDrawer}
    >
      {insideDrawer ? (
        <Header $visible={showCollapsedHeader}>
          {coverPhoto ? (
            <HeaderCover>
              <Cover
                className="header-cover-image"
                src={coverPhoto.asset}
                placeholderSrc={coverPhoto.thumbnail}
                fallbackVariant={CoverFallback.ARTIST}
                size="100%"
                shape={Shape.ROUNDED}
              />
            </HeaderCover>
          ) : null}
          <HeaderText>
            <ArtistDrawerTitle>{artist.name}</ArtistDrawerTitle>
            {artist.aliases.length ? (
              <ArtistDrawerDescription>
                {artist.aliases.join(' / ')}
              </ArtistDrawerDescription>
            ) : null}
          </HeaderText>
        </Header>
      ) : null}
      <div
        className="scrollable"
        ref={scrollableRef}
        onScroll={
          useCollapsingHeader ? updateCollapsedHeaderVisibility : undefined
        }
      >
        <div className="first-screen">
          <Info
            artist={artist}
            identityRef={identityRef}
          />
          {tabs.length > 1 ? (
            <MusicTabs $stickyTop={insideDrawer ? COLLAPSED_HEADER_HEIGHT : 0}>
              <TabList<ArtistMusicTab>
                current={currentTab}
                tabList={tabs}
                onChange={setTab}
              />
            </MusicTabs>
          ) : null}
          <MusicList musicList={musicList} />
        </div>
      </div>
      <Toolbar artist={artist} floatingControllerOffset={!insideDrawer} />
    </DetailContainer>
  );
}

function ArtistContent({
  id,
  insideDrawer = false,
}: {
  id: string;
  insideDrawer?: boolean;
}) {
  const { data, reload } = useData(id);

  useEffect(() => {
    if (!insideDrawer && data.value) {
      playerEventemitter.emit(EventType.ARTIST_DETAIL_LOADED, {
        id: data.value.id,
        name: data.value.name,
        aliases: data.value.aliases,
      });
    }
  }, [data.value, insideDrawer]);

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
    return (
      <Detail style={style} artist={d.value} insideDrawer={insideDrawer} />
    );
  });
}

export default ArtistContent;
