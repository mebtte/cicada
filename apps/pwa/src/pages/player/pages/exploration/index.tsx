import Spinner from '@/components/spinner';
import { flexCenter } from '@/style/flexbox';
import { animated, useTransition } from 'react-spring';
import styled from 'styled-components';
import ErrorCard from '@/components/error_card';
import SizeObserver from '@/components/size_observer';
import Empty from '@/components/empty';
import Button from '@/components_next/button';
import getResizedImage from '@/server/asset/get_resized_image';
import autoScrollbar from '@/style/auto_scrollbar';
import { t } from '@/i18n';
import { CSSVariable } from '@/global_style';
import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Query } from '@/constants';
import { useUser } from '@/global_states/server';
import { PLAYER_PATH, ROOT_PATH } from '@/constants/route';
import { HEADER_HEIGHT, SearchTab } from '../../constants';
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

const ITEM_MIN_WIDTH = 150;
const MOBILE_ITEM_WIDTH = 96;
const GAP = 14;
const MAX_SECTION_ROW_AMOUNT = 2;
const MOBILE_BREAKPOINT = 720;
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
  ${autoScrollbar}

  padding-bottom: env(safe-area-inset-bottom, 0);

  > .content {
    display: flex;
    flex-direction: column;
    gap: 26px;

    padding: 14px 16px 20px;
  }

  > .empty {
    height: 100%;
  }
`;
const EmptyFallback = styled.div`
  min-height: 100%;
  padding: 24px 16px calc(24px + env(safe-area-inset-bottom, 0));

  display: flex;
  align-items: center;
  justify-content: center;

  > .panel {
    width: min(560px, 100%);
    padding: 28px;

    border: 1px solid ${CSSVariable.COLOR_BORDER};
    border-radius: 18px;
    background: #fff;
    box-shadow: 0 18px 60px rgb(0 0 0 / 0.06);
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
const Section = styled.section`
  > .title {
    margin: 0 0 12px;

    color: ${CSSVariable.TEXT_COLOR_PRIMARY};
    font-size: ${CSSVariable.TEXT_SIZE_LARGE};
    font-weight: 600;
    text-transform: capitalize;
  }
`;
const SectionContent = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(${ITEM_MIN_WIDTH}px, 1fr));
  gap: ${GAP}px;

  @media (max-width: ${MOBILE_BREAKPOINT}px) {
    grid-template-columns: repeat(
      auto-fill,
      minmax(${MOBILE_ITEM_WIDTH}px, 1fr)
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
  renderItem,
}: {
  title: string;
  items: Item[];
  renderItem: (item: Item) => ReactNode;
}) {
  if (!items.length) {
    return null;
  }

  return (
    <Section>
      <h2 className="title">{title}</h2>
      <SizeObserver>
        {({ width }) => {
          const isMobile = width <= MOBILE_BREAKPOINT;
          const itemMinWidth = isMobile ? MOBILE_ITEM_WIDTH : ITEM_MIN_WIDTH;
          const amountOfOneLine = Math.max(
            1,
            Math.floor((width + GAP) / (itemMinWidth + GAP)),
          );
          const visibleItems = items.slice(
            0,
            amountOfOneLine * MAX_SECTION_ROW_AMOUNT,
          );
          return (
            <SectionContent>{visibleItems.map(renderItem)}</SectionContent>
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
            <Button variant="primary" onClick={() => navigate(ROOT_PATH.ADMIN)}>
              {t('admin_panel')}
            </Button>
          ) : null}
          <Button variant="secondary" onClick={openCreateMusicbillDialog}>
            {t('create_musicbill')}
          </Button>
          <Button
            variant="ghost"
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
                  renderItem={(music) => (
                    <Cover
                      key={music.id}
                      src={getResizedImage({
                        url: music.cover,
                        size: Math.ceil(ITEM_MIN_WIDTH * window.devicePixelRatio),
                      })}
                      onClick={() => openMusicDrawer(music.id)}
                      info={<MusicInfo music={music} />}
                    />
                  )}
                />
                <ExplorationSection
                  title={t('recommended_singer')}
                  items={d.value.singerList}
                  renderItem={(singer) => (
                    <Cover
                      key={singer.id}
                      src={getResizedImage({
                        url: singer.avatar,
                        size: Math.ceil(ITEM_MIN_WIDTH * window.devicePixelRatio),
                      })}
                      onClick={() => openSingerDrawer(singer.id)}
                      info={<SingerInfo singer={singer} />}
                    />
                  )}
                />
                <ExplorationSection
                  title={t('recommended_public_musicbill')}
                  items={d.value.publicMusicbillList}
                  renderItem={(publicMusicbill) => (
                    <Cover
                      key={publicMusicbill.id}
                      src={getResizedImage({
                        url: publicMusicbill.cover,
                        size: Math.ceil(ITEM_MIN_WIDTH * window.devicePixelRatio),
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
