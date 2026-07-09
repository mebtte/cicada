import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
} from 'react';
import { animated, useTransition } from '@react-spring/web';
import styled, { css } from 'styled-components';
import { flexCenter } from '@/style/flexbox';
import ErrorCard from '@/components/error_card';
import Spinner from '@/components/spinner';
import absoluteFullSize from '@/style/absolute_full_size';
import autoScrollbar from '@/style/auto_scrollbar';
import { CSSVariable } from '@/global_style';
import {
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components';
import AppDrawer from '@/components/app_drawer';
import Cover, { Shape } from '@/components/cover';
import useData from './use_data';
import { Musicbill as MusicbillType } from './constants';
import Info from './info';
import MusicList from './music_list';
import Toolbar from './toolbar';

const Container = styled(animated.div)`
  ${absoluteFullSize}
`;
const StatusContainer = styled(Container)`
  ${flexCenter}
`;
const DetailContainer = styled(Container)`
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
      height: calc(68px + env(safe-area-inset-bottom, 0));
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
const MusicbillDrawerTitle = styled(DrawerTitle)`
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
const MusicbillDrawerDescription = styled(DrawerDescription)`
  ${descriptionStyle}
`;
type AnimatedStyle = ComponentProps<typeof animated.div>['style'];

function Musicbill({
  style,
  musicbill,
  collected,
}: {
  style: AnimatedStyle;
  musicbill: MusicbillType;
  collected: boolean;
}) {
  const scrollableRef = useRef<HTMLDivElement | null>(null);
  const identityRef = useRef<HTMLElement | null>(null);
  const [showCollapsedHeader, setShowCollapsedHeader] = useState(false);

  const updateCollapsedHeaderVisibility = useCallback(() => {
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
  }, []);

  useEffect(() => {
    setShowCollapsedHeader(false);
    const frame = window.requestAnimationFrame(updateCollapsedHeaderVisibility);
    return () => window.cancelAnimationFrame(frame);
  }, [musicbill.id, updateCollapsedHeaderVisibility]);

  return (
    <DetailContainer style={style}>
      <Header $visible={showCollapsedHeader}>
        <HeaderCover>
          <Cover
            className="header-cover-image"
            src={musicbill.cover}
            placeholderSrc={musicbill.coverThumbnail}
            size="100%"
            shape={Shape.ROUNDED}
          />
        </HeaderCover>
        <HeaderText>
          <MusicbillDrawerTitle>{musicbill.name}</MusicbillDrawerTitle>
          <MusicbillDrawerDescription>
            {musicbill.user.nickname}
          </MusicbillDrawerDescription>
        </HeaderText>
      </Header>
      <div
        className="scrollable"
        ref={scrollableRef}
        onScroll={updateCollapsedHeaderVisibility}
      >
        <div className="first-screen">
          <Info musicbill={musicbill} identityRef={identityRef} />
          <MusicList
            musicList={musicbill.musicList}
            scrollElementRef={scrollableRef}
          />
        </div>
      </div>
      <Toolbar musicbill={musicbill} collected={collected} />
    </DetailContainer>
  );
}

function Wrapper({
  open,
  onClose,
  id,
  zIndex,
}: {
  open: boolean;
  onClose: () => void;
  id: string;
  zIndex: number;
}) {
  const { data, reload, collected } = useData(id);

  const transitions = useTransition(data, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
  });
  return (
    <AppDrawer
      open={open}
      onClose={onClose}
      width="wide"
      zIndex={zIndex}
    >
      {transitions((style, d) => {
        const { error, loading, musicbill } = d;
        if (error) {
          return (
            <StatusContainer style={style}>
              <ErrorCard errorMessage={error.message} retry={reload} />
            </StatusContainer>
          );
        }
        if (loading) {
          return (
            <StatusContainer style={style}>
              <Spinner />
            </StatusContainer>
          );
        }
        return (
          <Musicbill
            style={style}
            musicbill={musicbill!}
            collected={collected}
          />
        );
      })}
    </AppDrawer>
  );
}

export default Wrapper;
