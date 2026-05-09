import styled from 'styled-components';
import Spinner from '@/components/spinner';
import { flexCenter } from '@/style/flexbox';
import Empty from '@/components/empty';
import Pagination from '@/components/pagination';
import { CSSProperties, KeyboardEvent, MouseEvent, useCallback } from 'react';
import ErrorCard from '@/components/error_card';
import useNavigate from '@/utils/use_navigate';
import { Query } from '@/constants';
import { animated, useTransition } from 'react-spring';
import absoluteFullSize from '@/style/absolute_full_size';
import Button from '@/components/button';
import { PLAYER_PATH, ROOT_PATH } from '@/constants/route';
import getResizedImage from '@/server/asset/get_resized_image';
import autoScrollbar from '@/style/auto_scrollbar';
import { t } from '@/i18n';
import Cover from '@/components/cover';
import ellipsis from '@/style/ellipsis';
import { CSSVariable } from '@/global_style';
import { MdExplore, MdPerson, MdStar } from 'react-icons/md';
import playerEventemitter, {
  EventType as PlayerEventType,
} from '../../../eventemitter';
import {
  FLOATING_CONTROLLER_SCROLL_SPACE,
  SearchTab,
} from '../../../constants';
import useCollectionList from './use_collection_list';
import { Collection, PAGE_SIZE } from '../constants';

const CARD_IMAGE_SIZE = 220;
const MOBILE_BREAKPOINT = 560;
const ACCENT = {
  FACE: 'rgb(255 184 28)',
  SHADOW: 'rgb(214 130 0)',
  BLUE: 'rgb(28 176 246)',
  BLUE_SHADOW: 'rgb(24 132 183)',
  GREEN: 'rgb(88 204 2)',
  GREEN_SHADOW: 'rgb(88 167 0)',
};

const Style = styled.div`
  flex: 1;
  min-height: 0;

  position: relative;
`;
const Container = styled(animated.div)`
  ${absoluteFullSize}
`;
const CardContainer = styled(Container)`
  ${flexCenter}

  padding: 24px 16px;

  > .status-panel {
    width: min(560px, 100%);
    padding: 24px 20px;

    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }

  @media (max-width: ${MOBILE_BREAKPOINT}px) {
    align-items: flex-start;

    > .status-panel {
      padding: 20px 12px;

      > button {
        width: 100%;
      }
    }
  }
`;
const MusicListContainer = styled(Container)`
  overflow: auto;
  ${autoScrollbar}

  > .content {
    width: min(1120px, 100%);
    margin: 0 auto;
    padding: 20px 20px 0;
  }

  &::after {
    content: '';
    display: block;
    height: calc(${FLOATING_CONTROLLER_SCROLL_SPACE} + 24px);
  }

  @media (max-width: ${MOBILE_BREAKPOINT}px) {
    > .content {
      padding: 16px 16px 0;
    }

    &::after {
      height: calc(${FLOATING_CONTROLLER_SCROLL_SPACE} + 16px);
    }
  }
`;
const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(176px, 1fr));
  gap: 18px;

  @media (max-width: ${MOBILE_BREAKPOINT}px) {
    grid-template-columns: repeat(auto-fill, minmax(136px, 1fr));
    gap: 12px;
  }
`;
const MusicbillCardRoot = styled.div`
  position: relative;
  min-width: 0;
  padding: 10px 10px 9px;

  border: 2px solid ${ACCENT.SHADOW};
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 5px 0 ${ACCENT.SHADOW};

  cursor: pointer;
  outline: none;
  transition:
    transform 150ms ease-out,
    box-shadow 150ms ease-out,
    filter 120ms ease-out;

  &::before {
    content: '';
    position: absolute;
    top: 8px;
    right: 8px;
    width: 26px;
    height: 26px;

    border: 2px solid ${ACCENT.SHADOW};
    border-radius: 50%;
    background: ${ACCENT.FACE};
    box-shadow: 0 3px 0 ${ACCENT.SHADOW};
    z-index: 3;
  }

  > .star {
    position: absolute;
    top: 13px;
    right: 13px;
    z-index: 4;

    width: 16px;
    height: 16px;
    color: #fff;
    pointer-events: none;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 7px 0 ${ACCENT.SHADOW};
    filter: brightness(1.01);
  }

  &:active {
    transform: translateY(5px);
    box-shadow: none;
    transition:
      transform 60ms ease-in,
      box-shadow 60ms ease-in,
      filter 60ms ease-in;
  }

  &:focus-visible {
    outline: 3px solid ${ACCENT.BLUE};
    outline-offset: 3px;
  }
`;
const RecordScene = styled.div`
  position: relative;
  aspect-ratio: 1;
  overflow: visible;

  border-radius: 8px;
  background:
    linear-gradient(135deg, rgb(255 255 255), rgb(247 253 248)),
    #fff;

  > .disc {
    position: absolute;
    top: 8%;
    right: 1%;
    width: 72%;
    aspect-ratio: 1;
    z-index: 1;

    border: 3px solid ${ACCENT.BLUE_SHADOW};
    border-radius: 50%;
    background:
      radial-gradient(
        circle,
        #fff 0 8%,
        ${ACCENT.BLUE} 8.5% 20%,
        transparent 20.5%
      ),
      repeating-radial-gradient(
        circle,
        rgb(255 255 255 / 0.18) 0 3px,
        transparent 3px 10px
      ),
      linear-gradient(145deg, rgb(49 52 62), rgb(26 30 38));
    box-shadow: 0 5px 0 ${ACCENT.BLUE_SHADOW};
  }

  > .cover-frame {
    position: absolute;
    left: 4%;
    bottom: 7%;
    width: 82%;
    aspect-ratio: 1;
    z-index: 2;

    overflow: hidden;
    border: 3px solid ${ACCENT.SHADOW};
    border-radius: 8px;
    background: #fff;
    box-shadow: 0 5px 0 ${ACCENT.SHADOW};
    transform: rotate(-3deg);
  }

  > .cover-frame > .cover {
    width: 100%;
    height: 100%;
    border-radius: 5px;
  }

  > .stripe {
    position: absolute;
    left: 10%;
    top: 10%;
    width: 38%;
    height: 10px;
    z-index: 0;

    border-radius: 999px;
    background: ${ACCENT.GREEN};
    box-shadow:
      0 17px 0 rgb(229 244 255),
      0 34px 0 rgb(255 240 194);
  }
`;
const CardInfo = styled.div`
  margin-top: 10px;
  min-width: 0;

  > .name {
    color: ${CSSVariable.TEXT_COLOR_PRIMARY};
    font-family: 'Nunito', 'Varela Round', system-ui, sans-serif;
    font-size: ${CSSVariable.TEXT_SIZE_LARGE};
    font-weight: 900;
    line-height: 1.25;
    letter-spacing: 0;
    ${ellipsis}
  }
`;
const OwnerButton = styled.button`
  max-width: 100%;
  min-height: 28px;
  margin: 6px 0 0;
  padding: 0 8px;

  display: inline-flex;
  align-items: center;
  gap: 5px;

  border: 2px solid rgb(229 229 229);
  border-radius: 8px;
  background: #fff;
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  box-shadow: 0 3px 0 rgb(229 229 229);

  font-family: 'Nunito', 'Varela Round', system-ui, sans-serif;
  font-size: ${CSSVariable.TEXT_SIZE_SMALL};
  font-weight: 800;
  line-height: 1;
  cursor: pointer;

  > svg {
    flex: 0 0 auto;
    width: 15px;
    height: 15px;
  }

  > span {
    min-width: 0;
    ${ellipsis}
  }

  &:hover {
    color: ${CSSVariable.TEXT_COLOR_PRIMARY};
  }

  &:active {
    transform: translateY(3px);
    box-shadow: none;
  }
`;
const paginationStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  margin: '22px 0 0',
  maxWidth: '100%',
  overflowX: 'auto',
  padding: '0 2px 5px',
};

const openMusicbillDrawer = (id: string) =>
  playerEventemitter.emit(PlayerEventType.OPEN_MUSICBILL_DRAWER, { id });

function CollectionCard({ collection }: { collection: Collection }) {
  const cover = getResizedImage({
    url: collection.cover,
    size: Math.ceil(CARD_IMAGE_SIZE * window.devicePixelRatio),
  });

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }
    event.preventDefault();
    openMusicbillDrawer(collection.id);
  };
  const openUserDrawer = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    playerEventemitter.emit(PlayerEventType.OPEN_USER_DRAWER, {
      id: collection.user.id,
    });
  };

  return (
    <MusicbillCardRoot
      role="button"
      tabIndex={0}
      aria-label={`${collection.name} - ${collection.user.nickname}`}
      onClick={() => openMusicbillDrawer(collection.id)}
      onKeyDown={onKeyDown}
    >
      <MdStar className="star" />
      <RecordScene>
        <div className="stripe" />
        <div className="disc" />
        <div className="cover-frame">
          <Cover className="cover" src={cover} size="100%" />
        </div>
      </RecordScene>
      <CardInfo>
        <div className="name">{collection.name}</div>
        <OwnerButton type="button" onClick={openUserDrawer}>
          <MdPerson />
          <span>{collection.user.nickname}</span>
        </OwnerButton>
      </CardInfo>
    </MusicbillCardRoot>
  );
}

function CollectionList() {
  const navigate = useNavigate();
  const onPageChange = useCallback(
    (p: number) =>
      navigate({
        query: {
          [Query.PAGE]: p,
        },
      }),
    [navigate],
  );
  const navigateToDiscovery = useCallback(
    () =>
      navigate({
        path: ROOT_PATH.PLAYER + PLAYER_PATH.EXPLORATION,
        query: {
          [Query.SEARCH_TAB]: SearchTab.PUBLIC_MUSICBILL,
        },
      }),
    [navigate],
  );

  const { page, data, reload } = useCollectionList();

  const transitions = useTransition(data, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
  });
  return (
    <Style>
      {transitions((style, d) => {
        const { error, loading, value } = d;
        if (error) {
          return (
            <CardContainer style={style}>
              <div className="status-panel">
                <ErrorCard errorMessage={error.message} retry={reload} />
              </div>
            </CardContainer>
          );
        }
        if (loading) {
          return (
            <CardContainer style={style}>
              <div className="status-panel">
                <Spinner />
              </div>
            </CardContainer>
          );
        }

        if (!value!.total && !value!.collectionList.length) {
          return (
            <CardContainer style={style}>
              <div className="status-panel">
                <Empty description={t('no_suitable_musicbill')} />
                <Button
                  variant="primary"
                  icon={<MdExplore />}
                  onClick={navigateToDiscovery}
                >
                  {t('discover_musicbill')}
                </Button>
              </div>
            </CardContainer>
          );
        }

        return (
          <MusicListContainer style={style}>
            <div className="content">
              <Grid>
                {value!.collectionList.map((collection) => (
                  <CollectionCard
                    key={collection.id}
                    collection={collection}
                  />
                ))}
              </Grid>
              {value!.total ? (
                <Pagination
                  style={paginationStyle}
                  count={Math.ceil(value!.total / PAGE_SIZE)}
                  page={page}
                  onChange={onPageChange}
                />
              ) : null}
            </div>
          </MusicListContainer>
        );
      })}
    </Style>
  );
}

export default CollectionList;
