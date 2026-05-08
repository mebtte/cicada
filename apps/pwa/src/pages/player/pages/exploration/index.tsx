import Spinner from '@/components/spinner';
import { flexCenter } from '@/style/flexbox';
import { animated, useTransition } from 'react-spring';
import styled from 'styled-components';
import ErrorCard from '@/components/error_card';
import SizeObserver from '@/components/size_observer';
import Empty from '@/components/empty';
import Button from '@/components/button';
import getResizedImage from '@/server/asset/get_resized_image';
import autoScrollbar from '@/style/auto_scrollbar';
import { t } from '@/i18n';
import { CSSVariable } from '@/global_style';
import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Query } from '@/constants';
import { useUser } from '@/global_states/server';
import { PLAYER_PATH, ROOT_PATH } from '@/constants/route';
import {
  MdAdd,
  MdAdminPanelSettings,
  MdMic,
  MdMusicNote,
  MdQueueMusic,
  MdSearch,
} from 'react-icons/md';
import { FLOATING_CONTROLLER_SCROLL_SPACE, SearchTab } from '../../constants';
import Page from '../page';
import useData from './use_data';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../eventemitter';
import { openCreateMusicbillDialog } from '../../utils';
import Cover from './cover';
import MusicInfo from './music_info';
import SingerInfo from './singer_info';
import PublicMusicbillInfo from './public_musicbill_info';

const ITEM_MIN_WIDTH = 164;
const MOBILE_ITEM_WIDTH = 96;
const GAP = 16;
const MAX_SECTION_ROW_AMOUNT = 2;
const MOBILE_BREAKPOINT = 720;
const ACCENT = {
  MUSIC: 'rgb(88 204 2)',
  MUSIC_SHADOW: 'rgb(88 167 0)',
  SINGER: 'rgb(28 176 246)',
  SINGER_SHADOW: 'rgb(24 132 183)',
  MUSICBILL: 'rgb(255 184 28)',
  MUSICBILL_SHADOW: 'rgb(214 130 0)',
};
const Root = styled(Page)`
  position: relative;
  background: rgb(248 249 250);
`;
const Container = styled(animated.div)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
`;
const StatusContainer = styled(Container)`
  ${flexCenter}
  background: rgb(248 249 250);
`;
const ContentContainer = styled(Container)`
  overflow: auto;
  background:
    linear-gradient(180deg, rgb(247 253 248) 0, rgb(248 249 250) 310px),
    rgb(248 249 250);
  ${autoScrollbar}

  > .content {
    width: min(1120px, 100%);
    margin: 0 auto;
    padding: 20px 20px 24px;

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
  padding: 24px 16px;

  display: flex;
  align-items: center;
  justify-content: center;

  > .panel {
    width: min(560px, 100%);
    padding: 28px 26px 32px;

    border: 2px solid ${CSSVariable.COLOR_BORDER};
    border-radius: 8px;
    background: #fff;
    box-shadow: 0 6px 0 rgb(224 224 224);
    text-align: center;

    > .placeholder {
      gap: 10px;

      > .placeholder {
        width: 150px;
      }

      > .description {
        color: ${CSSVariable.TEXT_COLOR_PRIMARY};
        font-size: ${CSSVariable.TEXT_SIZE_LARGE};
        font-weight: 600;
      }
    }

    > .description {
      margin: 14px auto 0;
      max-width: 420px;

      color: ${CSSVariable.TEXT_COLOR_SECONDARY};
      font-size: ${CSSVariable.TEXT_SIZE_NORMAL};
      line-height: 1.7;
    }

    > .actions {
      margin-top: 22px;

      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 12px;
    }
  }

  @media (max-width: ${MOBILE_BREAKPOINT}px) {
    align-items: flex-start;

    > .panel {
      padding: 22px 18px;

      > .actions {
        flex-direction: column;

        > button {
          width: 100%;
        }
      }
    }
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
  playerEventemitter.emit(PlayerEventType.OPEN_PUBLIC_MUSICBILL_DRAWER, { id });

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

function ExplorationEmptyFallback({ reload }: { reload: () => void }) {
  const navigate = useNavigate();
  const user = useUser()!;

  return (
    <EmptyFallback>
      <div className="panel">
        <Empty
          className="placeholder"
          description={t('exploration_empty_title')}
        />
        <div className="description">{t('exploration_empty_description')}</div>
        <div className="actions">
          {user.admin ? (
            <Button
              variant="primary"
              icon={<MdAdminPanelSettings />}
              onClick={() => navigate(ROOT_PATH.ADMIN)}
            >
              {t('admin_panel')}
            </Button>
          ) : null}
          <Button
            variant="secondary"
            icon={<MdAdd />}
            onClick={openCreateMusicbillDialog}
          >
            {t('create_musicbill')}
          </Button>
          <Button
            variant="ghost"
            icon={<MdSearch />}
            onClick={() =>
              navigate(
                `${ROOT_PATH.PLAYER}${PLAYER_PATH.SEARCH}?${Query.SEARCH_TAB}=${SearchTab.PUBLIC_MUSICBILL}`,
              )
            }
          >
            {t('search_public_musicbill')}
          </Button>
          <Button variant="plain" onClick={reload}>
            {t('retry')}
          </Button>
        </div>
      </div>
    </EmptyFallback>
  );
}

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
                      variant="record"
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
              <ExplorationEmptyFallback reload={reload} />
            )}
          </ContentContainer>
        );
      })}
    </Root>
  );
}

export default Wrapper;
