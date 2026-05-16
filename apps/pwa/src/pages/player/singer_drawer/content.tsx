import styled, { css } from 'styled-components';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
} from 'react';
import { animated, useTransition } from 'react-spring';
import absoluteFullSize from '@/style/absolute_full_size';
import { flexCenter } from '@/style/flexbox';
import ErrorCard from '@/components/error_card';
import Spinner from '@/components/spinner';
import autoScrollbar from '@/style/auto_scrollbar';
import { DrawerDescription, DrawerHeader, DrawerTitle } from '@/components';
import Cover, { Shape } from '@/components/cover';
import useData from './use_data';
import { Singer } from './constants';
import Info from './info';
import Toolbar from './toolbar';
import MusicList from './music_list';
import playerEventemitter, { EventType } from '../eventemitter';
import { FLOATING_CONTROLLER_SCROLL_SPACE } from '../constants';

const Container = styled(animated.div)`
  ${absoluteFullSize}
`;
const CardContainer = styled(Container)`
  ${flexCenter}
`;
const DetailContainer = styled(Container)<{ $floatingControllerOffset: boolean }>`
  display: flex;
  flex-direction: column;

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
          : 'calc(68px + env(safe-area-inset-bottom, 0))'};
    }
  }
`;
const Header = styled(DrawerHeader)<{ $visible: boolean }>`
  z-index: 2;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 72px;
  padding: 0 20px;
  box-sizing: border-box;

  display: flex;
  align-items: center;
  pointer-events: none;

  background-color: ${({ $visible }) =>
    $visible ? 'rgb(255 255 255 / 0.92)' : 'transparent'};
  border-bottom: 1px solid
    ${({ $visible }) => ($visible ? 'rgb(229 229 229)' : 'transparent')};
  backdrop-filter: ${({ $visible }) => ($visible ? 'blur(8px)' : 'none')};
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
  border: 2px solid rgb(229 229 229);
  border-radius: 12px;
  box-shadow: 0 4px 0 rgb(229 229 229);

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
const SingerDrawerTitle = styled(DrawerTitle)`
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
const SingerDrawerDescription = styled(DrawerDescription)`
  ${descriptionStyle}
`;
type AnimatedStyle = ComponentProps<typeof animated.div>['style'];

function Detail({
  style,
  singer,
  insideDrawer,
}: {
  style: AnimatedStyle;
  singer: Singer;
  insideDrawer: boolean;
}) {
  const scrollableRef = useRef<HTMLDivElement | null>(null);
  const identityRef = useRef<HTMLElement | null>(null);
  const [showCollapsedHeader, setShowCollapsedHeader] = useState(false);
  const useCollapsingHeader = insideDrawer;

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
  }, [singer.id, updateCollapsedHeaderVisibility, useCollapsingHeader]);

  return (
    <DetailContainer
      style={style}
      $floatingControllerOffset={!insideDrawer}
    >
      {insideDrawer ? (
        <Header $visible={showCollapsedHeader}>
          {singer.photos[0] ? (
            <HeaderCover>
              <Cover
                className="header-cover-image"
                src={singer.photos[0].asset}
                size="100%"
                shape={Shape.ROUNDED}
              />
            </HeaderCover>
          ) : null}
          <HeaderText>
            <SingerDrawerTitle>{singer.name}</SingerDrawerTitle>
            {singer.aliases.length ? (
              <SingerDrawerDescription>
                {singer.aliases.join(' / ')}
              </SingerDrawerDescription>
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
            singer={singer}
            identityRef={identityRef}
          />
          <MusicList
            musicList={singer.musicList.map((m, index) => ({
              ...m,
              index: singer.musicList.length - index,
            }))}
          />
        </div>
      </div>
      <Toolbar singer={singer} floatingControllerOffset={!insideDrawer} />
    </DetailContainer>
  );
}

function SingerContent({
  id,
  insideDrawer = false,
}: {
  id: string;
  insideDrawer?: boolean;
}) {
  const { data, reload } = useData(id);

  useEffect(() => {
    if (!insideDrawer && data.value) {
      playerEventemitter.emit(EventType.SINGER_DETAIL_LOADED, {
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
      <Detail style={style} singer={d.value} insideDrawer={insideDrawer} />
    );
  });
}

export default SingerContent;
