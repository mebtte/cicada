import Spinner from '@/components/spinner';
import { flexCenter } from '@/style/flexbox';
import { animated, useTransition } from 'react-spring';
import styled, { css } from 'styled-components';
import ErrorCard from '@/components/error_card';
import SizeObserver from '@/components/size_observer';
import Empty from '@/components/empty';
import getResizedImage from '@/server/asset/get_resized_image';
import autoScrollbar from '@/style/auto_scrollbar';
import { t } from '@/i18n';
import { CSSVariable } from '@/global_style';
import { ReactNode } from 'react';
import { Query } from '@/constants';
import useQuery from '@/utils/use_query';
import useNavigate from '@/utils/use_navigate';
import { useTheme } from '@/global_states/theme';
import { DuolingoTabList } from '@/components/duolingo_tabs';
import { MdMic, MdMusicNote, MdQueueMusic } from 'react-icons/md';
import { FLOATING_CONTROLLER_SCROLL_SPACE, SearchTab } from '../../constants';
import Page, { PAGE_HORIZONTAL_PADDING } from '../page';
import useData from './use_data';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../eventemitter';
import Cover from './cover';
import MusicInfo from './music_info';
import SingerInfo from './singer_info';
import PublicMusicbillInfo from './public_musicbill_info';
import SearchInput from '../search/input';
import SearchContent from '../search/content';
import useSearchTab from '../search/use_tab';
import {
  MINI_MODE_TOOLBAR_HEIGHT,
  TAB_LIST,
  TOOLBAR_HEIGHT,
} from '../search/constants';

const ITEM_MIN_WIDTH = 164;
const MOBILE_ITEM_WIDTH = 96;
const GAP = 16;
const MAX_SECTION_ROW_AMOUNT = 2;
const MOBILE_BREAKPOINT = 720;
const SEARCH_TOOLBAR_CONTENT_INSET = '12px';
const ACCENT = {
  MUSIC: 'rgb(88 204 2)',
  MUSIC_SHADOW: 'rgb(88 167 0)',
  SINGER: 'rgb(28 176 246)',
  SINGER_SHADOW: 'rgb(24 132 183)',
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
    padding: calc(var(--recommendation-toolbar-height) + 20px)
      ${PAGE_HORIZONTAL_PADDING} 24px;

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
    margin-bottom: 14px;

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
  $itemMinWidth: number;
  $mobileItemMinWidth: number;
}>`
  display: grid;
  grid-template-columns: repeat(
    auto-fill,
    minmax(${({ $itemMinWidth }) => $itemMinWidth}px, 1fr)
  );
  gap: ${GAP}px;

  @media (max-width: ${MOBILE_BREAKPOINT}px) {
    grid-template-columns: repeat(
      auto-fill,
      minmax(${({ $mobileItemMinWidth }) => $mobileItemMinWidth}px, 1fr)
    );
  }
`;

const openMusicDrawer = (id: string) =>
  playerEventemitter.emit(PlayerEventType.OPEN_MUSIC_DRAWER, { id });
const openSingerDrawer = (id: string) =>
  playerEventemitter.emit(PlayerEventType.OPEN_SINGER_DRAWER, { id });
const openMusicbillDrawer = (id: string) =>
  playerEventemitter.emit(PlayerEventType.OPEN_MUSICBILL_DRAWER, { id });

function ExplorationSection<Item>({
  title,
  items,
  icon,
  accent,
  shadow,
  itemMinWidth = ITEM_MIN_WIDTH,
  mobileItemMinWidth = MOBILE_ITEM_WIDTH,
  renderItem,
}: {
  title: string;
  items: Item[];
  icon: ReactNode;
  accent: string;
  shadow: string;
  itemMinWidth?: number;
  mobileItemMinWidth?: number;
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
      <SizeObserver>
        {({ width }) => {
          const isMobile = width <= MOBILE_BREAKPOINT;
          const activeItemMinWidth = isMobile
            ? mobileItemMinWidth
            : itemMinWidth;
          const amountOfOneLine = Math.max(
            1,
            Math.floor((width + GAP) / (activeItemMinWidth + GAP)),
          );
          const visibleItems = items.slice(
            0,
            amountOfOneLine * MAX_SECTION_ROW_AMOUNT,
          );
          return (
            <SectionContent
              $itemMinWidth={itemMinWidth}
              $mobileItemMinWidth={mobileItemMinWidth}
            >
              {visibleItems.map(renderItem)}
            </SectionContent>
          );
        }}
      </SizeObserver>
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
  const searching = mode === 'search';

  if (!searching && !miniMode) {
    return null;
  }

  return (
    <div
      className={`search-toolbar ${
        searching ? 'search-mode-toolbar' : 'recommendation-toolbar'
      }`}
    >
      {miniMode ? <SearchInput autoFocus={searching} /> : null}
      {searching ? (
        <DuolingoTabList<SearchTab>
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
          d.value.singerList.length ||
          d.value.publicMusicbillList.length;
        return (
          <ContentContainer style={style}>
            {hasData ? (
              <div className="content">
                <ExplorationSection
                  title={t('recommended_music')}
                  items={d.value.musicList}
                  icon={<MdMusicNote />}
                  accent={ACCENT.MUSIC}
                  shadow={ACCENT.MUSIC_SHADOW}
                  renderItem={(music) => (
                    <Cover
                      key={music.id}
                      accent={ACCENT.MUSIC}
                      shadow={ACCENT.MUSIC_SHADOW}
                      variant="record"
                      src={getResizedImage({
                        url: music.cover,
                        size: Math.ceil(
                          ITEM_MIN_WIDTH * window.devicePixelRatio,
                        ),
                      })}
                      onClick={() => openMusicDrawer(music.id)}
                      info={<MusicInfo music={music} />}
                    />
                  )}
                />
                <ExplorationSection
                  title={t('recommended_singer')}
                  items={d.value.singerList}
                  icon={<MdMic />}
                  accent={ACCENT.SINGER}
                  shadow={ACCENT.SINGER_SHADOW}
                  itemMinWidth={240}
                  mobileItemMinWidth={148}
                  renderItem={(singer) => {
                    const avatar = singer.photos[0]?.asset;
                    return (
                      <Cover
                        key={singer.id}
                        accent={ACCENT.SINGER}
                        shadow={ACCENT.SINGER_SHADOW}
                        variant="profile"
                        src={
                          avatar
                            ? getResizedImage({
                                url: avatar,
                                size: Math.ceil(
                                  ITEM_MIN_WIDTH * window.devicePixelRatio,
                                ),
                              })
                            : ''
                        }
                        onClick={() => openSingerDrawer(singer.id)}
                        info={<SingerInfo singer={singer} />}
                      />
                    );
                  }}
                />
                <ExplorationSection
                  title={t('recommended_public_musicbill')}
                  items={d.value.publicMusicbillList}
                  icon={<MdQueueMusic />}
                  accent={ACCENT.MUSICBILL}
                  shadow={ACCENT.MUSICBILL_SHADOW}
                  renderItem={(publicMusicbill) => (
                    <Cover
                      key={publicMusicbill.id}
                      accent={ACCENT.MUSICBILL}
                      shadow={ACCENT.MUSICBILL_SHADOW}
                      variant="cassette"
                      src={getResizedImage({
                        url: publicMusicbill.cover,
                        size: Math.ceil(
                          ITEM_MIN_WIDTH * window.devicePixelRatio,
                        ),
                      })}
                      onClick={() => openMusicbillDrawer(publicMusicbill.id)}
                      info={
                        <PublicMusicbillInfo
                          publicMusicbill={publicMusicbill}
                        />
                      }
                    />
                  )}
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
