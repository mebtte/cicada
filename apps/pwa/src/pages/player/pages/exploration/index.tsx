import Spinner from '@/components/spinner';
import { flexCenter } from '@/style/flexbox';
import { animated, useTransition } from '@react-spring/web';
import styled, { css } from 'styled-components';
import ErrorCard from '@/components/error_card';
import Empty from '@/components/empty';
import getResizedImage from '@/server/asset/get_resized_image';
import autoScrollbar from '@/style/auto_scrollbar';
import { t } from '@/i18n';
import { CSSVariable } from '@/global_style';
import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Query } from '@/constants';
import useQuery from '@/utils/use_query';
import useNavigate from '@/utils/use_navigate';
import { useTheme } from '@/global_states/theme';
import { TabList } from '@/components/tabs';
import {
  EXPLORATION_FOCUS_SEARCH_STATE,
  FLOATING_CONTROLLER_SCROLL_SPACE,
  SearchTab,
} from '../../constants';
import Page, { PAGE_HORIZONTAL_PADDING } from '../page';
import useData from './use_data';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../eventemitter';
import Cover from './cover';
import MusicInfo from './music_info';
import ArtistInfo from './artist_info';
import PublicMusicbillInfo from './public_musicbill_info';
import SearchInput from '../search/input';
import SearchContent from '../search/content';
import useSearchTab from '../search/use_tab';
import {
  MINI_MODE_TOOLBAR_HEIGHT,
  TAB_LIST,
  TOOLBAR_HEIGHT,
} from '../search/constants';
import { Microphone, MusicNote, QueueMusic as QueueMusicIcon } from '@/components/icon';

const ITEM_WIDTH = 164;
const ARTIST_ITEM_WIDTH = 240;
const MOBILE_ITEM_WIDTH = 132;
const MOBILE_ARTIST_ITEM_WIDTH = 200;
const GAP = 16;
const MOBILE_BREAKPOINT = 720;
const SEARCH_TOOLBAR_CONTENT_INSET = '12px';
const ACCENT = {
  MUSIC: 'rgb(88 204 2)',
  MUSIC_SHADOW: 'rgb(88 167 0)',
  ARTIST: 'rgb(28 176 246)',
  ARTIST_SHADOW: 'rgb(24 132 183)',
  MUSICBILL: 'rgb(255 184 28)',
  MUSICBILL_SHADOW: 'rgb(214 130 0)',
};
type ExplorationMode = 'recommendation' | 'search';

const Root = styled(Page)`
  position: relative;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgb(247 253 248) 0, rgb(248 249 250) 310px),
    rgb(248 249 250);

  > .search-toolbar {
    z-index: 2;

    position: absolute;
    top: 0;
    left: 0;
    width: 100%;

    padding: 14px ${PAGE_HORIZONTAL_PADDING};

    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    gap: 8px;
  }

  ${({ theme: { miniMode } }) => css`
    --recommendation-toolbar-height: ${miniMode ? TOOLBAR_HEIGHT : 0}px;
    --search-mode-toolbar-height: ${miniMode
      ? MINI_MODE_TOOLBAR_HEIGHT
      : TOOLBAR_HEIGHT}px;

    > .search-toolbar {
      height: var(--search-mode-toolbar-height);
      gap: ${miniMode ? 12 : 8}px;
      background: transparent;
      pointer-events: none;
    }

    > .search-toolbar > .input,
    > .search-toolbar > .search-tabs {
      width: calc(100% - ${SEARCH_TOOLBAR_CONTENT_INSET} * 2);
      align-self: center;
      pointer-events: auto;
    }

    > .search-toolbar.recommendation-toolbar {
      height: var(--recommendation-toolbar-height);
    }
  `}
`;
const Container = styled(animated.div)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
`;
const SwitchPanel = styled.div<{ $active: boolean }>`
  position: absolute;
  inset: 0;

  opacity: ${({ $active }) => ($active ? 1 : 0)};
  transform: ${({ $active }) =>
    $active
      ? 'translate3d(0, 0, 0) scale(1)'
      : 'translate3d(0, 10px, 0) scale(0.995)'};
  pointer-events: ${({ $active }) => ($active ? 'auto' : 'none')};
  transition:
    opacity 180ms ease-out,
    transform 180ms ease-out;
`;
const StatusContainer = styled(Container)`
  ${flexCenter}
`;
const ContentContainer = styled(Container)`
  overflow: auto;
  ${autoScrollbar}

  > .content {
    width: 100%;
    /* 横向滚动的卡片需要贴边, 这里只给上下间距, 左右留给小节自行处理。 */
    padding: calc(var(--recommendation-toolbar-height) + 20px) 0 24px;

    display: flex;
    flex-direction: column;
    gap: 30px;
  }

  > .empty {
    height: 100%;
  }

  &::after {
    content: '';
    display: block;
    height: ${FLOATING_CONTROLLER_SCROLL_SPACE};
  }
`;
const EmptyFallback = styled.div`
  min-height: 100%;
  padding: calc(var(--recommendation-toolbar-height) + 24px)
    ${PAGE_HORIZONTAL_PADDING} 24px;

  display: flex;
  align-items: center;
  justify-content: center;

  @media (max-width: ${MOBILE_BREAKPOINT}px) {
    align-items: flex-start;
  }
`;
const Section = styled.section<{
  $accent: string;
  $shadow: string;
}>`
  > .heading {
    margin: 0 ${PAGE_HORIZONTAL_PADDING} 14px;

    display: flex;
    align-items: center;
    gap: 12px;

    > .badge {
      flex: 0 0 auto;
      width: 44px;
      height: 44px;

      display: flex;
      align-items: center;
      justify-content: center;

      border: 2px solid ${({ $shadow }) => $shadow};
      border-radius: 50%;
      background: ${({ $accent }) => $accent};
      box-shadow: 0 4px 0 ${({ $shadow }) => $shadow};
      color: #fff;

      > svg {
        width: 24px;
        height: 24px;
      }
    }

    > .title-group {
      min-width: 0;
      flex: 1;

      > .title {
        margin: 0;

        color: ${CSSVariable.TEXT_COLOR_PRIMARY};
        font-size: ${CSSVariable.TEXT_SIZE_LARGE};
        font-weight: 900;
        letter-spacing: 0;
        text-transform: capitalize;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  }
`;
const SectionContent = styled.div<{
  $itemWidth: number;
  $mobileItemWidth: number;
}>`
  /* 横向滚动: 卡片不换行, 容器内部用滚动区出现/隐藏滚动条。 */
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  gap: ${GAP}px;

  /* 留出阴影/抬起动效需要的空间, 避免在滚动区裁切。
   * 注意: overflow-x 非 visible 时, overflow-y 会被计算成 auto,
   * 因此顶部也需要 padding 容纳 hover 时 translateY(-2px) 的上移。 */
  padding-top: 4px;
  padding-bottom: 8px;
  overflow-x: auto;
  overflow-y: visible;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    display: none;
  }

  > * {
    flex: 0 0 ${({ $itemWidth }) => $itemWidth}px;
    width: ${({ $itemWidth }) => $itemWidth}px;
  }

  /* 首尾两侧用 margin 给出页面留白; 滚动容器的 padding 在 Safari/旧浏览器
   * 的尾部经常被忽略, 用 margin 才能稳定保留留白。 */
  > *:first-child {
    margin-inline-start: ${PAGE_HORIZONTAL_PADDING};
  }

  > *:last-child {
    margin-inline-end: ${PAGE_HORIZONTAL_PADDING};
  }

  @media (max-width: ${MOBILE_BREAKPOINT}px) {
    > * {
      flex-basis: ${({ $mobileItemWidth }) => $mobileItemWidth}px;
      width: ${({ $mobileItemWidth }) => $mobileItemWidth}px;
    }
  }
`;

const openMusicDrawer = (id: string) =>
  playerEventemitter.emit(PlayerEventType.OPEN_MUSIC_DRAWER, { id });
const openArtistDrawer = (id: string) =>
  playerEventemitter.emit(PlayerEventType.OPEN_ARTIST_DRAWER, { id });
const openMusicbillDrawer = (id: string) =>
  playerEventemitter.emit(PlayerEventType.OPEN_MUSICBILL_DRAWER, { id });

function ExplorationSection<Item>({
  title,
  items,
  icon,
  accent,
  shadow,
  itemWidth = ITEM_WIDTH,
  mobileItemWidth = MOBILE_ITEM_WIDTH,
  renderItem,
}: {
  title: string;
  items: Item[];
  icon: ReactNode;
  accent: string;
  shadow: string;
  itemWidth?: number;
  mobileItemWidth?: number;
  renderItem: (item: Item) => ReactNode;
}) {
  if (!items.length) {
    return null;
  }

  return (
    <Section $accent={accent} $shadow={shadow}>
      <div className="heading">
        <div className="badge">{icon}</div>
        <div className="title-group">
          <h2 className="title">{title}</h2>
        </div>
      </div>
      <SectionContent
        $itemWidth={itemWidth}
        $mobileItemWidth={mobileItemWidth}
      >
        {items.map(renderItem)}
      </SectionContent>
    </Section>
  );
}

function ExplorationEmptyFallback() {
  return (
    <EmptyFallback className="empty">
      {/* Fresh installs can have no recommendable content; keep a plain empty state here. */}
      <Empty />
    </EmptyFallback>
  );
}

function ExplorationToolbar({
  mode,
  tab,
}: {
  mode: ExplorationMode;
  tab: SearchTab;
}) {
  const navigate = useNavigate();
  const { miniMode } = useTheme();
  const location = useLocation();
  const searching = mode === 'search';
  // header 搜索按钮跳转过来时会带上该 state, 据此在搜索框挂载时自动聚焦。
  const focusSearch = !!(location.state as Record<string, unknown> | null)?.[
    EXPLORATION_FOCUS_SEARCH_STATE
  ];

  if (!searching && !miniMode) {
    return null;
  }

  return (
    <div
      className={`search-toolbar ${
        searching ? 'search-mode-toolbar' : 'recommendation-toolbar'
      }`}
    >
      {miniMode ? <SearchInput autoFocus={searching || focusSearch} /> : null}
      {searching ? (
        <TabList<SearchTab>
          className="search-tabs"
          current={tab}
          tabList={TAB_LIST}
          onChange={(t) =>
            navigate({
              query: {
                [Query.SEARCH_TAB]: t,
                [Query.PAGE]: 1,
              },
            })
          }
        />
      ) : null}
    </div>
  );
}

function SearchPanel({ tab }: { tab: SearchTab }) {
  return <SearchContent tab={tab} />;
}

function RecommendationPanel() {
  const { data, reload } = useData();

  const transitions = useTransition(data, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
  });
  // 由于音乐卡片宽度固定 (record/cassette = ITEM_WIDTH, profile = ARTIST_ITEM_WIDTH),
  // 请求图片时也用该宽度乘 devicePixelRatio 计算最终尺寸。
  const imageSize = Math.ceil(ITEM_WIDTH * window.devicePixelRatio);
  return (
    <>
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
        const hasData =
          d.value.musicList.length ||
          d.value.artistList.length ||
          d.value.publicMusicbillList.length ||
          d.value.recentMusicList.length ||
          d.value.recentArtistList.length ||
          d.value.recentPublicMusicbillList.length;
        // 把单个卡片的渲染封装出来, 让 "推荐" 与 "最近添加" 复用相同的视觉单元。
        const renderMusicCard = (
          music: (typeof d.value.musicList)[number],
        ) => (
          <Cover
            key={music.id}
            accent={ACCENT.MUSIC}
            shadow={ACCENT.MUSIC_SHADOW}
            variant="record"
            src={getResizedImage({ url: music.cover, size: imageSize })}
            placeholderSrc={music.coverThumbnail}
            onClick={() => openMusicDrawer(music.id)}
            info={<MusicInfo music={music} />}
          />
        );
        const renderArtistCard = (
          artist: (typeof d.value.artistList)[number],
        ) => {
          const avatar = artist.photos[0]?.asset;
          const avatarThumbnail = artist.photos[0]?.thumbnail;
          return (
            <Cover
              key={artist.id}
              accent={ACCENT.ARTIST}
              shadow={ACCENT.ARTIST_SHADOW}
              variant="profile"
              src={
                avatar ? getResizedImage({ url: avatar, size: imageSize }) : ''
              }
              placeholderSrc={avatarThumbnail}
              onClick={() => openArtistDrawer(artist.id)}
              info={<ArtistInfo artist={artist} />}
            />
          );
        };
        const renderMusicbillCard = (
          publicMusicbill: (typeof d.value.publicMusicbillList)[number],
        ) => (
          <Cover
            key={publicMusicbill.id}
            accent={ACCENT.MUSICBILL}
            shadow={ACCENT.MUSICBILL_SHADOW}
            variant="cassette"
            src={getResizedImage({
              url: publicMusicbill.cover,
              size: imageSize,
            })}
            onClick={() => openMusicbillDrawer(publicMusicbill.id)}
            info={<PublicMusicbillInfo publicMusicbill={publicMusicbill} />}
          />
        );
        return (
          <ContentContainer style={style}>
            {hasData ? (
              <div className="content">
                <ExplorationSection
                  title={t('recommended_music')}
                  items={d.value.musicList}
                  icon={<MusicNote />}
                  accent={ACCENT.MUSIC}
                  shadow={ACCENT.MUSIC_SHADOW}
                  renderItem={renderMusicCard}
                />
                <ExplorationSection
                  title={t('recommended_artists')}
                  items={d.value.artistList}
                  icon={<Microphone />}
                  accent={ACCENT.ARTIST}
                  shadow={ACCENT.ARTIST_SHADOW}
                  itemWidth={ARTIST_ITEM_WIDTH}
                  mobileItemWidth={MOBILE_ARTIST_ITEM_WIDTH}
                  renderItem={renderArtistCard}
                />
                <ExplorationSection
                  title={t('recommended_public_musicbills')}
                  items={d.value.publicMusicbillList}
                  icon={<QueueMusicIcon />}
                  accent={ACCENT.MUSICBILL}
                  shadow={ACCENT.MUSICBILL_SHADOW}
                  renderItem={renderMusicbillCard}
                />
                <ExplorationSection
                  title={t('recent_music')}
                  items={d.value.recentMusicList}
                  icon={<MusicNote />}
                  accent={ACCENT.MUSIC}
                  shadow={ACCENT.MUSIC_SHADOW}
                  renderItem={renderMusicCard}
                />
                <ExplorationSection
                  title={t('recent_artists')}
                  items={d.value.recentArtistList}
                  icon={<Microphone />}
                  accent={ACCENT.ARTIST}
                  shadow={ACCENT.ARTIST_SHADOW}
                  itemWidth={ARTIST_ITEM_WIDTH}
                  mobileItemWidth={MOBILE_ARTIST_ITEM_WIDTH}
                  renderItem={renderArtistCard}
                />
                <ExplorationSection
                  title={t('recent_public_musicbills')}
                  items={d.value.recentPublicMusicbillList}
                  icon={<QueueMusicIcon />}
                  accent={ACCENT.MUSICBILL}
                  shadow={ACCENT.MUSICBILL_SHADOW}
                  renderItem={renderMusicbillCard}
                />
              </div>
            ) : (
              <ExplorationEmptyFallback />
            )}
          </ContentContainer>
        );
      })}
    </>
  );
}

function Wrapper() {
  const { keyword = '' } = useQuery<Query.KEYWORD>();
  const normalizedKeyword = keyword.replace(/\s+/g, ' ').trim();
  const mode: ExplorationMode = normalizedKeyword ? 'search' : 'recommendation';
  const tab = useSearchTab();

  return (
    <Root>
      <SwitchPanel
        key="recommendation-panel"
        $active={mode === 'recommendation'}
      >
        <RecommendationPanel />
      </SwitchPanel>
      {mode === 'search' ? (
        <SwitchPanel key="search-panel" $active>
          <SearchPanel tab={tab} />
        </SwitchPanel>
      ) : null}
      <ExplorationToolbar key="exploration-toolbar" mode={mode} tab={tab} />
    </Root>
  );
}

export default Wrapper;
